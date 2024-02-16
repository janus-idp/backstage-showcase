export const waitsObjs = {
  MuiLinearProgress: 'div[class*="MuiLinearProgress-root"]',
  MuiCircularProgress: '[class*="MuiCircularProgress-root"]',
};

export const UIhelperPO = {
  buttonLabel: 'span[class^="MuiButton-label"]',
  MuiBoxLabel: 'div[class*="MuiBox-root"] label',
  MuiTableCell: 'td[class*="MuiTableCell-root"]',
  MuiTableRow: 'tr[class*="MuiTableRow-root"]',
  MuiCard: cardHeading =>
    `//div[contains(@class,'MuiCardHeader-root') and descendant::*[text()='${cardHeading}']]/..`,
  tabs: '[role="tab"]',
  rowByText: (text: string) => `tr:has(:text-is("${text}"))`,
};
