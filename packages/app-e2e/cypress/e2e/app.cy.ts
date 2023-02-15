describe('App', () => {
  it('should render the catalog', () => {
    cy.visit('/');
    cy.contains('Quick Access');

    cy.visit('/catalog');
    cy.contains('Janus IDP Catalog');
  });
});
