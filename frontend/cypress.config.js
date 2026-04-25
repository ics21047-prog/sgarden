'use strict';

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3002',
    specPattern: 'cypress/e2e/smoke/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 3000,
    requestTimeout: 8000,
    pageLoadTimeout: 20000,
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, _config) {
      const C = { reset: '\x1b[0m', grey: '\x1b[90m', green: '\x1b[32m', red: '\x1b[31m', bold: '\x1b[1m', cyan: '\x1b[36m' };
      const grey = (s) => `${C.grey}${s}${C.reset}`;
      const green = (s) => `${C.green}${s}${C.reset}`;
      const red = (s) => `${C.red}${s}${C.reset}`;
      const bold = (s) => `${C.bold}${s}${C.reset}`;
      const cyan = (s) => `${C.cyan}${s}${C.reset}`;
      const SPEC_NAMES = {
        'cypress/e2e/smoke/1-easy.cy.js':   'Easy   (M1–M8)',
        'cypress/e2e/smoke/2-medium.cy.js': 'Medium (M9–M17)',
        'cypress/e2e/smoke/3-hard.cy.js':   'Hard   (M18–M20)',
      };

      const formatPercent = (numerator, denominator) => {
        if (denominator <= 0) return '0.0%';
        return `${((numerator / denominator) * 100).toFixed(1)}%`;
      };

      const parseMissionTitle = (titlePath) => {
        if (!Array.isArray(titlePath)) return null;
        const missionTitle = titlePath.find((part) => /^M\d+\s*:/.test(part));
        if (!missionTitle) return null;

        const idMatch = missionTitle.match(/^(M\d+)\s*:/);
        if (!idMatch) return null;

        const maxPointsMatch = missionTitle.match(/\((\d+)\s*pts\)/i);
        return {
          id: idMatch[1],
          title: missionTitle,
          maxPoints: maxPointsMatch ? Number(maxPointsMatch[1]) : 0,
        };
      };

      let specStart = 0;
      let currentSpec = '';

      on('before:spec', (spec) => {
        specStart = Date.now();
        currentSpec = SPEC_NAMES[spec.relative] ?? spec.relative;
        process.stdout.write(`\n  ${bold('▶')}  Running ${bold(currentSpec)}\n`);
      });

      on('after:spec', (_spec, results) => {
        const p = results.stats.passes ?? 0;
        const f = results.stats.failures ?? 0;
        const total = p + f;
        const completion = formatPercent(p, total);
        const points = completion;
        const durationMs = results.stats.duration ?? (Date.now() - specStart);
        const s = Math.round(durationMs / 1000);
        const icon = f === 0 ? green('✓') : red('✗');
        const counts = f === 0
          ? green(`${p} passed`)
          : `${green(`${p} passed`)}, ${red(`${f} failed`)}`;
        const missionSummary = `${bold(`${p}/${total}`)} complete (${completion})`;
        const pointsSummary = `points: ${bold(points)}`;
        process.stdout.write(`  ${icon}  ${currentSpec} — ${counts} | ${missionSummary} | ${pointsSummary} ${grey(`(${s}s)`)}\n`);

        const missionStats = new Map();
        for (const test of results.tests ?? []) {
          const mission = parseMissionTitle(test.title);
          if (!mission) continue;

          if (!missionStats.has(mission.id)) {
            missionStats.set(mission.id, {
              id: mission.id,
              title: mission.title,
              maxPoints: mission.maxPoints,
              passed: 0,
              failed: 0,
            });
          }

          const bucket = missionStats.get(mission.id);
          if (test.state === 'passed') {
            bucket.passed += 1;
          } else if (test.state === 'failed') {
            bucket.failed += 1;
          }
        }

        const missions = Array.from(missionStats.values())
          .sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

        for (const mission of missions) {
          const missionTotal = mission.passed + mission.failed;
          const missionPct = formatPercent(mission.passed, missionTotal);
          const missionPctValue = missionTotal > 0 ? (mission.passed / missionTotal) * 100 : 0;
          const earnedPoints = mission.maxPoints > 0
            ? (mission.maxPoints * missionPctValue) / 100
            : 0;
          const missionIcon = mission.failed === 0 && missionTotal > 0 ? green('✓') : red('✗');
          const missionNumber = mission.id.replace(/^M/, '');
          const missionPoints = `${earnedPoints.toFixed(1)} pts`;
          process.stdout.write(
            `     ${missionIcon} ${cyan(`Mission ${missionNumber}`)} — ${bold(missionPct)} completed, ${bold(missionPoints)} ${grey(`(${mission.passed}/${missionTotal} tests, max ${mission.maxPoints} pts)`)}\n`,
          );
        }
      });

      return _config;
    },
  },
  env: {
    // Backend API base URL (no trailing slash)
    apiUrl: 'http://localhost:4000/api',
  },
});
