export class ImageRegistry {
  static getAllCellsIdentifier() {
    const tagText = new RegExp('pr');
    const lastModifiedDate = new RegExp(
      /^[A-Za-z]{3} \d{1,2}, \d{4}, \d{1,2}:\d{2} (AM|PM)$/,
    );
    const size = new RegExp('MB');
    const expires =
      '^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), [0-3]?[0-9] (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) [0-9]{4} [0-2]?[0-9]:[0-5][0-9]:[0-5][0-9] [\\+\\-][0-9]{4}$';
    const expiresRegex = new RegExp(expires);
    const manifest = new RegExp('sha256');
    return [tagText, lastModifiedDate, size, expiresRegex, manifest];
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
}
