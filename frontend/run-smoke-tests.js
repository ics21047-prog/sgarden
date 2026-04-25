#!/usr/bin/env node
'use strict';

/**
 * SGarden Hackathon — Smoke Test Runner
 *
 * Uses the Cypress Module API (quiet mode) so that only our own
 * formatted mission summary is written to the terminal.
 *
 * Usage (from the repo root):
 *   npm run smoke:test
 */

const path = require('path');
const { spawnSync } = require('child_process');
const cypress = require(path.join(__dirname, '..', 'node_modules', 'cypress'));

// ── ANSI helpers ────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  grey: '\x1b[90m',
};
const bold = (s) => `${C.bold}${s}${C.reset}`;
const green = (s) => `${C.green}${s}${C.reset}`;
const red = (s) => `${C.red}${s}${C.reset}`;
const grey = (s) => `${C.grey}${s}${C.reset}`;
const cyan = (s) => `${C.cyan}${s}${C.reset}`;

// Known noisy logs from browser startup/tooling that we intentionally hide.
const SUPPRESSED_LOG_PATTERNS = [
  /^DevTools listening on ws:\/\//,
  /^Browserslist: caniuse-lite is outdated\./,
  /^\s*npx update-browserslist-db@latest/,
  /^\s*Why you should do it regularly:/,
];

// ── Layout constants ─────────────────────────────────────────────────────────
const W = 70;
const DOUBLE = '═'.repeat(W);
const SINGLE = '─'.repeat(W);

// ── Helpers ──────────────────────────────────────────────────────────────────
function write(line = '') {
  process.stdout.write(line + '\n');
}

function startProgressTicker(label, intervalMs = 10000) {
  const startedAt = Date.now();
  let lastRenderedLength = 0;

  const renderLive = (message) => {
    const padded = message.padEnd(lastRenderedLength, ' ');
    process.stdout.write(`\r${padded}`);
    lastRenderedLength = padded.length;
  };

  renderLive(grey(`  ${label}...`));

  return () => {
    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
    renderLive(grey(`  ${label} done (${elapsedSec}s)`));
    process.stdout.write('\n');
  };
}

function shouldSuppressLine(line) {
  const trimmed = (line || '').trimEnd();
  return SUPPRESSED_LOG_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function createFilteredWriter(originalWrite) {
  let remainder = '';

  return {
    write(chunk, encoding, callback) {
      const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);

      // Live ticker updates use carriage-return without newline; pass them through
      // immediately so users see progress while Cypress is running.
      if (text.includes('\r')) {
        if (remainder && !shouldSuppressLine(remainder)) {
          originalWrite(remainder, encoding);
        }
        remainder = '';
        originalWrite(text, encoding);
        if (typeof callback === 'function') callback();
        return true;
      }

      const merged = remainder + text;
      const lines = merged.split(/\r?\n/);
      remainder = lines.pop() ?? '';

      const visible = lines.filter((line) => !shouldSuppressLine(line));
      if (visible.length > 0) {
        originalWrite(visible.join('\n') + '\n', encoding);
      }

      if (typeof callback === 'function') callback();
      return true;
    },
    flush() {
      if (remainder && !shouldSuppressLine(remainder)) {
        originalWrite(remainder);
      }
      remainder = '';
    },
  };
}

async function runWithFilteredLogs(runFn) {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  const stdoutFilter = createFilteredWriter(originalStdoutWrite);
  const stderrFilter = createFilteredWriter(originalStderrWrite);

  process.stdout.write = stdoutFilter.write;
  process.stderr.write = stderrFilter.write;

  try {
    return await runFn();
  } finally {
    stdoutFilter.flush();
    stderrFilter.flush();
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
}

function printBanner() {
  write();
  write(cyan('╔' + DOUBLE + '╗'));
  write(cyan('║') + bold('  SGarden Hackathon — Running Smoke Tests …'.padEnd(W)) + cyan('║'));
  write(cyan('╚' + DOUBLE + '╝'));
  write();
}

function printSummary(results) {
  if (!results || results.status === 'failed') {
    write(red('\n  ✖  Cypress could not start. Is the app running at the configured baseUrl?'));
    write(grey('     Base URL: http://localhost:3002'));
    write(grey('     Backend:  http://localhost:4000'));
    write();
    return;
  }

  // ── Aggregate tests by mission (first title segment from describe block) ──
  const missionMap = new Map();

  for (const run of results.runs || []) {
    // A run can fail at the spec level (e.g. app not reachable)
    if (run.error) {
      const specName = run.spec?.relative ?? 'unknown spec';
      const fallback = missionMap.get(specName) ?? {
        title: specName,
        passed: 0,
        failed: 1,
        failedTests: [`Spec error: ${run.error}`],
        points: '',
      };
      if (!missionMap.has(specName)) missionMap.set(specName, fallback);
      continue;
    }

    for (const test of run.tests || []) {
      const missionName = test.title?.[0] ?? 'Unknown';
      if (!missionMap.has(missionName)) {
        missionMap.set(missionName, {
          title: missionName,
          passed: 0,
          failed: 0,
          failedTests: [],
        });
      }
      const mission = missionMap.get(missionName);
      if (test.state === 'passed') {
        mission.passed += 1;
      } else if (test.state === 'failed') {
        mission.failed += 1;
        // Grab the shortest useful error snippet
        const rawErr = (test.displayError ?? '').split('\n')[0].trim();
        const checkName = test.title.slice(1).join(' › ');
        mission.failedTests.push({ check: checkName, err: rawErr });
      }
    }
  }

  // ── Sort by mission number (M1, M2, …, M20) ──────────────────────────────
  const missions = [...missionMap.values()].sort((a, b) => {
    const nA = parseInt((a.title.match(/M(\d+)/) ?? [0, 999])[1], 10);
    const nB = parseInt((b.title.match(/M(\d+)/) ?? [0, 999])[1], 10);
    return nA - nB;
  });

  // ── Print results table ───────────────────────────────────────────────────
  write();
  write(cyan('╔' + DOUBLE + '╗'));
  write(cyan('║') + bold('  SGarden Hackathon — Smoke Test Results'.padEnd(W)) + cyan('║'));
  write(cyan('╚' + DOUBLE + '╝'));
  write();

  let totalPassed = 0;
  let totalFailed = 0;
  let missionsPassed = 0;
  let missionsFailed = 0;

  for (const f of missions) {
    const allOk = f.failed === 0 && (f.passed > 0 || f.failedTests.length === 0);
    const icon = allOk ? green('✓') : red('✗');
    const badge = allOk ? green(' PASS ') : red(' FAIL ');
    const title = allOk ? bold(f.title) : f.title;

    write(`  ${icon} [${badge}]  ${title}`);

    if (allOk) {
      write(grey(`           ↳ all ${f.passed} check${f.passed !== 1 ? 's' : ''} passed`));
    } else {
      for (const ft of f.failedTests) {
        write(red(`           ↳ FAILED: ${ft.check}`));
        if (ft.err) write(grey(`                    ${ft.err.slice(0, 80)}`));
      }
    }

    totalPassed += f.passed;
    totalFailed += f.failed;
    if (allOk) missionsPassed += 1;
    else missionsFailed += 1;
  }

  if (missions.length === 0) {
    write(red('  No test results found. Did any specs run?'));
  }

  write();
  write('  ' + SINGLE);
  const fp = green(`${missionsPassed} passed`);
  const ff = missionsFailed > 0 ? red(`${missionsFailed} failed`) : grey('0 failed');
  const tp = green(`${totalPassed} passed`);
  const tf = totalFailed > 0 ? red(`${totalFailed} failed`) : grey('0 failed');
  write(`  Missions : ${fp}, ${ff}    Checks : ${tp}, ${tf}`);
  write('  ' + SINGLE);
  write();
}

// ── Seed test accounts ───────────────────────────────────────────────────────
function seedTestUsers() {
  const seedScript = path.join(__dirname, '..', 'scripts', 'seed-test-users.js');
  process.stdout.write('  Seeding test accounts… ');
  const result = spawnSync(process.execPath, [seedScript], {
    encoding: 'utf8',
    timeout: 30000,
  });
  if (result.status !== 0) {
    write(red('FAILED'));
    write(grey(`  ${(result.stderr || result.stdout || '').trim().split('\n')[0]}`));
    write(grey('  Tests will likely fail. Is the backend database reachable?'));
  } else {
    write(green('OK'));
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  // Hide browserslist old-data warning from frontend tooling during smoke runs.
  process.env.BROWSERSLIST_IGNORE_OLD_DATA = '1';

  printBanner();
  seedTestUsers();
  write(grey('  Preparing Cypress smoke run...'));

  let results;
  let stopTicker = () => {};
  try {
    stopTicker = startProgressTicker('Running smoke specs');
    results = await runWithFilteredLogs(() =>
      cypress.run({
        project: __dirname,                              // frontend/ directory
        configFile: path.join(__dirname, 'cypress.config.js'),
        spec: path.join(__dirname, 'cypress', 'e2e', 'smoke', '**', '*.cy.js'),
        reporter: path.join(__dirname, 'cypress', 'reporters', 'silent-reporter.js'),
        quiet: true,                                     // suppress Cypress's own stdout
        config: {
          video: false,
          screenshotOnRunFailure: false,
        },
      }),
    );
    stopTicker();
  } catch (err) {
    stopTicker();
    write(red(`\n  ✖  Cypress run threw an error: ${err.message}`));
    write(grey('     Make sure the frontend is running: npm run frontend:start'));
    write(grey('     and the backend is running:        npm run backend:dev'));
    process.exitCode = 1;
    return;
  }

  write(grey('  Building mission summary...'));
  printSummary(results);

  // Exit 1 if any mission has failures so CI can detect problems
  const anyFailed = (results?.totalFailed ?? 0) > 0;
  process.exitCode = anyFailed ? 1 : 0;
})();
