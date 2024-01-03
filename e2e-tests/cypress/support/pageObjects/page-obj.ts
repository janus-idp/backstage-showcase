export const HomePagePO = {
  searchBar: 'input[aria-label="Search"]',
  MuiAccordion: 'div[class*="MuiAccordion-root-"]',
};

export const CatalogImportPO = {
  componentURL: 'input[name="url"]',
};

export const BackstageShowcasePO = {
  tableNextPage: 'button[aria-label="Next Page"]',
  tablePreviousPage: 'button[aria-label="Previous Page"]',
  tableLastPage: 'button[aria-label="Last Page"]',
  tableFirstPage: 'button[aria-label="First Page"]',
  tableRows: 'table[class*="MuiTable-root-"] tbody tr',
  tablePageSelectBox: 'div[class*="MuiTablePagination-input"]',
};

export const SettingsPagePO = {
  userSettingsMenu: 'button[data-testid="user-settings-menu"]',
  signOut: 'li[data-testid="sign-out"]',
};
