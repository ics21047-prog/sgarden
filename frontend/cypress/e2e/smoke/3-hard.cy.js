// =============================================================================
//  M18 – M20  |  HARD missions (200 – 300 pts)
// =============================================================================

// ---------------------------------------------------------------------------
// M18: Real-Time Collaborative Dashboard (250 pts)
// ---------------------------------------------------------------------------
describe('M18: Real-Time Collaborative Dashboard (250 pts)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/dashboard');
  });

  it('realtime-status indicator exists on /dashboard', () => {
    cy.get('[data-testid="realtime-status"]').should('exist');
  });

  it('realtime-status-connected is visible after page load', () => {
    cy.get('[data-testid="realtime-status-connected"]').should('be.visible');
  });

  it('realtime-viewers container and viewer-count exist', () => {
    cy.get('[data-testid="realtime-viewers"]').should('exist');
    cy.get('[data-testid="realtime-viewer-count"]').should('exist');
  });
});

// ---------------------------------------------------------------------------
// M19: Advanced Search & Global Filter (200 pts)
// ---------------------------------------------------------------------------
describe('M19: Advanced Search & Global Filter (200 pts)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/dashboard');
  });

  it('global-search-trigger exists in the header', () => {
    cy.get('[data-testid="global-search-trigger"]').should('exist');
  });

  it('clicking global-search-trigger opens dialog with input', () => {
    cy.get('[data-testid="global-search-trigger"]').click();
    cy.get('[data-testid="global-search-dialog"]').should('be.visible');
    cy.get('[data-testid="global-search-input"]').should('be.visible');
  });

  it('global-search-close button exists inside the search dialog', () => {
    cy.get('[data-testid="global-search-trigger"]').click();
    cy.get('[data-testid="global-search-close"]').should('exist');
  });
});

// ---------------------------------------------------------------------------
// M20: CSV/JSON Data Import (200 pts)
// ---------------------------------------------------------------------------
describe('M20: CSV/JSON Data Import (200 pts)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/dashboard');
  });

  it('sidebar-import-link navigates to import-page', () => {
    cy.get('[data-testid="sidebar-import-link"]').click();
    cy.get('[data-testid="import-page"]').should('be.visible');
  });

  it('import-dropzone and import-file-input exist on import-page', () => {
    cy.get('[data-testid="sidebar-import-link"]').click();
    cy.get('[data-testid="import-dropzone"]').should('exist');
    cy.get('[data-testid="import-file-input"]').should('exist');
  });

  it('import-submit and import-cancel exist on import-page', () => {
    cy.get('[data-testid="sidebar-import-link"]').click();
    cy.get('[data-testid="import-submit"]').should('exist');
    cy.get('[data-testid="import-cancel"]').should('exist');
  });
});
