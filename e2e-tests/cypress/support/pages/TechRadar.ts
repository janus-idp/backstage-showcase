export class TechRadar {
  static verifyRadarDetails(section: string, text: string) {
    cy.contains('h2', section)
      .parent()
      .contains(text)
      .scrollIntoView()
      .should('be.visible');
  }
}
