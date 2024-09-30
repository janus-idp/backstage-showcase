# Audit Logging for Backstage Showcase

Backstage Showcase supports audit logging for both the catalog and scaffolder. Audit logs can be identified by the `isAuditLog: true` field.

## Configuring the audit logger

### Logging to Console

By default, the audit logger logs to the console. To disable this, update your app-config.yaml with:

```yaml
auditLog:
  console:
    enabled: false
```

### Logging to a Rotating File

#### Enabling Rotating File Logging

To enable audit logging to a rotating file, set the following in your configuration (this feature is disabled by default):

```yaml
auditLog:
  rotateFile:
    enabled: true
```

With this configuration, the default behavior is:

- Rotate logs at midnight (local system timezone)
- Log file format: redhat-developer-hub-audit-%DATE%.log
- Log files stored in /var/log/redhat-developer-hub/audit
- No automatic log file deletion
- No gzip compression of archived logs
- No file size limit

#### Customizing Log File Location and Name

To change the directory where log files are stored, specify a custom path (an absolute path is recommended): By default, the audit logs are written in the `/var/log/redhat-developer-hub/audit` directory.

```yaml
auditLog:
  rotateFile:
    logFileDirPath: /custom-path
```

---

**NOTE**

The specified directory will be created automatically if it does not exist.

---

By default, the audit log files will be in the following format: `redhat-developer-hub-audit-%DATE%.log` where `%DATE%` is the format specified in [`auditLog.rotateFile.dateFormat`](#configuring-the-file-rotation-frequency).

To customize the log file name format, use:

```yaml
auditLog:
  rotateFile:
    logFileName: custom-audit-log-%DATE%.log
```

#### Configuring File Rotation Frequency

The default file rotation occurs daily at 00:00 local time. You can adjust the rotation frequency with the following configurations:

```yaml
auditLog:
  rotateFile:
    frequency: '12h' # Default: `custom`
    dateFormat: 'YYYY-MM-DD' # Default: `YYYY-MM-DD`
    utc: false # Default: `false`
    maxSize: 100m # Default: undefined
```

`frequency` options include:

- `daily`: Rotate daily at 00:00 local time
- `Xm`: Rotate every X minutes (where X is a number between 0 and 59)
- `Xh`: Rotate every X hours (where X is a number between 0 and 23)
- `test`: Rotate every 1 minute
- `custom`: Use `dateFormat` to set the rotation frequency (default if frequency is not specified)

---

**NOTE**
If `frequency` is set to `Xh`, `Xm` or `test`, the `dateFormat` setting must be configured in a format that includes the specified time component. Otherwise, the rotation will not work as expected.

For example, `dateFormat: 'YYYY-MM-DD-HH'` for hourly rotation. `dateFormat: 'YYYY-MM-DD-HH-mm'` for minute rotation.

---

Examples:

```yaml
auditLog:
  rotateFile:
    # If you want to rotate the file every 17 minutes
    dateFormat: 'YYYY-MM-DD-HH-mm'
    frequency: '17m'
```

The `dateFormat` setting configures both the %DATE% in logFileName and the file rotation frequency if frequency is set to `custom`. The default format is `YYYY-MM-DD`, meaning daily rotation. Supported values are based on [Moment.js formats](https://momentjs.com/docs/#/displaying/format/).

If `frequency` is set to `custom`, then rotations will take place when the date string, represented in the specified `dateFormat`, changes.

Examples:

```yaml
auditLog:
  rotateFile:
    # If you want rotations to occur every week for some reason and at the start of each month. Example `%DATE$` = '2025-Jul-Week 30'
    dateFormat: 'YYYY-MMM-[Week] ww'
```

```yaml
auditLog:
  rotateFile:
    # If you want to rotate the file at noon and midnight
    dateFormat: 'YYYY-MM-DD-A'
```

To use UTC time for `dateFormat` instead of local time:

```yaml
auditLog:
  rotateFile:
    utc: true # Default: False
```

To set a maximum log file size before rotation (which would add a count suffix to the filename upon reaching the size limit): Ex: `redhat-developer-hub-audit-2024-07-22.log.3`.

To configure `maxSize`, provide a number followed by one of `k`, `m`, or `g` to specify the file size in kilobytes, megabytes, or gigabytes. No `maxSize` is configured by default.

```yaml
auditLog:
  rotateFile:
    maxSize: 100m # Sets a max file size limit of 100MB for audit log
```

#### Configuring File Retention Policy

By default, log files are not deleted or archived. You can configure the maximum number of files to keep:

```yaml
auditLog:
  rotateFile:
    maxFilesOrDays: 14 # Deletes the oldest log when there are more than 14 log files
```

Or, configure the maximum number of days to retain logs by appending:

```yaml
auditLog:
  rotateFile:
    maxFilesOrDays: 5d # Deletes logs older than 5 days
```

---

**NOTE**

If log deletion is enabled, a `.<sha256 hash>-audit.json` will be generated in the directory where the logs are to track generated logs. Any log file not contained in it will not be subject to automatic deletion.

Currently, a new `.<sha256 hash>-audit.json` file is generated every time the backend is started. This means old audit logs will no longer be tracked/deleted with the exception of any log files reused by the current backend.

---

To archive and compress rotated logs using gzip:

```yaml
auditLog:
  rotateFile:
    zippedArchive: true # Default: false
```
