import { Page } from '@playwright/test';
import { UIhelperPO } from '../../support/pageObjects/global-obj';

export class ImageRegistry {
  static getAllCellsIdentifier() {
    //create a regex to verify if the string contains pr on it

    const tagText = /pr/i;
    const lastModifiedDate = new RegExp(
      /^[A-Za-z]{3} \d{1,2}, \d{4}, \d{1,2}:\d{2} (AM|PM)$/,
    );
    const size = /(GB|MB)/;
    const expires =
      '^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \\d{4} \\d{1,2}:\\d{2}:\\d{2} [\\+\\-]\\d{4}$';
    const expiresRegex = new RegExp(expires);
    const manifest = /sha256/;

    return [
      tagText,
      lastModifiedDate,
      this.securityScanRegex(),
      size,
      expiresRegex,
      manifest,
    ];
  }

  static getAllGridColumnsText() {
    return [
      'Tag',
      'Last Modified',
      'Security Scan',
      'Size',
      'Expires',
      'Manifest',
    ];
  }

  static securityScanRegex() {
    const securityScan = ['Critical', 'High', 'Medium', 'Low', 'Unknown'].map(
      i => `(${i}:\\s\\d+[^\\w]*)`,
    );
    return new RegExp(`^(Passed|unsupported|(?:${securityScan.join('|')})+)$`);
  }

  static getAllScanColumnsText() {
    return [
      'Advisory',
      'Severity',
      'Package Name',
      'Current Version',
      'Fixed By',
    ];
  }

  static getScanCellsIdentifier() {
    const advisory = /^(CVE|RHSA)-.+/;
    const severity = /Critical|High|Medium|Low|Unknown/;
    const version = /^(\d+:)?\d+\.\d+/;

    return [advisory, severity, version];
  }

  static async getScanCell(page: Page) {
    const locator = page
      .locator(UIhelperPO.MuiTableCell)
      .filter({ hasText: this.securityScanRegex() });
    await locator.first().waitFor();
    return locator.first();
  }
}
