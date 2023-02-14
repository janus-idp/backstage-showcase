describe('App', () => {
  it('should render the catalog', () => {
    cy.visit('/');
    cy.contains('Quick Access');

    cy.visit('/catalog');
    cy.contains('Red Hat Catalog');
  });
});
