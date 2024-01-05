import { HomePagePO } from '../pageObjects/page-obj';
import { UIhelper } from '../../utils/UIhelper';

export class HomePage {
  static verifyQuickSearchBar(text: string) {
    cy.get(HomePagePO.searchBar)
      .should('be.visible')
      .clear()
      .type(text + '{enter}');
    UIhelper.verifyLink(text);
  }

  static verifyQuickAccess(
    section: string,
    quickAccessItem: string,
    expand = false,
  ) {
    cy.contains(HomePagePO.MuiAccordion, section).within($section => {
      if (expand) cy.wrap($section).click();
      cy.contains('a div[class*="MuiListItemText-root"]', quickAccessItem)
        .scrollIntoView({ duration: 1000 })
        .should('be.visible');
    });
  }
}
