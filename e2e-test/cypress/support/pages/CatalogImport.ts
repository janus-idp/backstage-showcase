import { CatalogImportPO } from '../pageObjects/page-obj';
import { UIhelper } from '../../utils/UIhelper';

export class CatalogImport {
  static registerExistingComponent(url: string) {
    cy.get(CatalogImportPO.componentURL).clear().type(url);
    UIhelper.clickButton('Analyze');
    UIhelper.clickButton('Import');
    UIhelper.clickButton('View Component');
  }
}
