export const waitsObjs = {
  MuiLinearProgress: 'div[class*="MuiLinearProgress-root"]',
  MuiCircularProgress: '[class*="MuiCircularProgress-root"]',
};

export const UIhelperPO = {
  buttonLabel: 'span[class^="MuiButton-label"]',
  MuiBoxLabel: 'div[class*="MuiBox-root"] label',
  MuiTableCell: 'td[class*="MuiTableCell-root"]',
  MuiTableRow: 'tr[class*="MuiTableRow-root"]',
  MuiCardHeader: 'div[class*="MuiCardHeader-root"]',
  tabs: '[role="tab"]',
  rowByText: (text: string) => `tr:has(td:text-is("${text}"))`,
};
