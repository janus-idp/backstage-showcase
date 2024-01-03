export class CatalogUsersPO {
  static BASE_URL = '/catalog?filters%5Bkind%5D=user&filters%5Buser';

  static getListOfUsers() {
    return cy.get('a[href*="/catalog/default/user"]');
  }

  static getEmailLink() {
    return cy.get('a[href*="mailto"][href*="@"]');
  }

  static visitUserPage(username) {
    return cy.get(`a[href="/catalog/default/user/${username}"]`).click();
  }

  static getGroupLink(groupName) {
    return cy.get(`a[href="/catalog/default/group/${groupName}"]`);
  }

  static visitBaseURL() {
    cy.visit(this.BASE_URL);
  }
}
