export interface Config {
  /**
   * Configuration for the audit logging
   * @visibility frontend
   */
  auditLog?: {
    /**
     * Configuration for the audit logging to console
     * @visibility frontend
     */
    console: {
      /**
       * Enables audit logging to console
       * Default: true
       * @visibility frontend
       */
      enabled: boolean;
    };
    /**
     * Configuration for the log rotation file
     * @visibility frontend
     */
    rotateFile?: {
      /**
       * Enables audit logging to a rotating file
       * Default: false
       * @visibility frontend
       */
      enabled: boolean;
      /**
       * Configures the frequency of the log rotation
       * Default: custom -> uses `dateFormat` configuration to rotate logs
       * Supports minutes (ex: 14m), hourly (ex: 14h), daily, test
       * @visibility frontend
       */
      frequency: string;
      /**
       * The name of the generated log file:
       * Default: redhat-developer-hub-audit-%DATE%.log
       * @visibility frontend
       */
      logFileName: string;
      /**
       * Configures the directory to write the log files to
       * Creates directory at given path if no directory exists at path.
       * Default: /var/log/redhat-developer-hub/audit
       * @visibility frontend
       */
      logFileDirPath: string;
      /**
       * Format as used in moment.js http://momentjs.com/docs/#/displaying/format/. The result is used to replace the '%DATE%' placeholder in the filename.
       * If using frequency is not defined, it is used to trigger file rotation when the string representation changes.
       * Use this if you want to rotate less often than daily
       * Default: YYYY-MM-DD
       * @visibility frontend
       */
      dateFormat: string;
      /**
       * The maximum size log files can get before a rotation is triggered
       * Maximum size of the file after which it will rotate. This can be a number of bytes, or units of kb, mb, and gb.
       * If using the units, add 'k', 'm', or 'g' as the suffix. Units need to directly follow a number e.g. 1g, 100m, 20k.
       * @visibility frontend
       */
      maxSize: string;
      /**
       * The max number of files to retain or the max number of days to retain files
       * If not set, it won't remove past logs.
       * @visibility frontend
       */
      maxFilesOrDays: number | string;
      /**
       * Whether to gzip archived log files to save space
       * Default: false
       * @visibility frontend
       */
      zippedArchive: boolean;
      /**
       * Sets whether dates for log files are in UTC format
       * Default: false
       * @visibility frontend
       */
      utc: boolean;
    };
  };
}
