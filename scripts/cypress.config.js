'use strict';

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3002',
    specPattern: '../frontend/cypress/e2e/smoke/**/*.cy.js',
    supportFile: '../frontend/cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 3000,
    requestTimeout: 8000,
    pageLoadTimeout: 20000,
    video: false,
    screenshotOnRunFailure: false,
    // Suppress Cypress's own test-level output; summary comes from run-smoke-tests.cjs
    setupNodeEvents(_on, _config) {
      // No-op: summary printing is handled by the run script
      return _config;
    },
  },
  env: {
    // Backend API base URL (no trailing slash)
    apiUrl: 'http://localhost:4000/api',
  },
});
