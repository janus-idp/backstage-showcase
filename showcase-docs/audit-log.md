# Audit Logging for Backstage Showcase

Backstage Showcase currently supports audit logging for the catalog and scaffolder. Audit logs are signified by the `isAuditLog: true` field.

## Configuring the audit logger

### Configuring the audit logging to console

By default, the audit logger will log to the console. You can disable this behavior by setting the following in your `app-config.yaml`:

```yaml
auditLog:
  logToConsole: false
```

### Configuring the audit logging to a rotating file

#### Enabling Audit Logging to a rotating file

Backstage Showcase also supports forwarding the audit logs to a rotating file. By default this is disabled, to enable it set the following:

```yaml
auditLog:
  rotate:
    enabled: true
```

The default behavior with the above configuration is:

- Rotate at midnight of the local system timezone
- Output logs to a file with the format of: `redhat-developer-hub-audit-%DATE%.log`
- Store log files in the `/var/log/redhat-developer-hub/audit` directory
- Does not remove old logs
- Does not gzip archived logs
- No file size limit

#### Configuring custom location and file name

By default, the audit logs will be written in the `/var/log/redhat-developer-hub/audit` directory. To customize the destination in which the audit log files will be generated, provide the path to the directory (an absolute path is recommended):

```yaml
auditLog:
  rotate:
    logFileDirPath: /custom-path
```

---

**NOTE**

If no directory exists in the specified path, the directory will be automatically generated

---

By default, the audit log files will be in the following format: `redhat-developer-hub-audit-%DATE%.log` where `%DATE%` is the format specified in [`auditLog.rotate.dateFormat`](#configuring-the-file-rotation-frequency).

You can customize it by setting your custom file format:

```yaml
auditLog:
  rotate:
    logFileName: custom-audit-log-%DATE%.log
```

#### Configuring the file rotation frequency

By default, the file rotation would occur daily at 00:00 of the local timezone of the system the backstage showcase is running on. There are multiple configurations to configure the file rotation frequency:

```yaml
auditLog:
  rotate:
    frequency: '12h' # Default: `custom`
    dateFormat: 'YYYY-MM-DD' # Default: `YYYY-MM-DD`
    utc: false # Default: `false`
    maxSize: 100m # Default: undefined
```

The `frequency` configuration supports the following inputs:

- `daily`: Rotates daily at 00:00 of the local timezone
- `Xm`: Rotates every X minutes
- `Xh`: Rotates every X hours
- `test`: Rotates every 1 minute
- `custom`: Uses the `dateFormat` to configure the rotation frequency. This is the default configuration if `frequency` is not provided.

The `dateFormat` configuration configures both the `%DATE%` value used by the `logFileName`, as well as the file rotation frequency if `frequency` is set to `custom`. The default format is `YYYY-MM-DD` meaning it will rotate the file whenever the `YYYY-MM-DD` changes (daily rotate). The supported values are those used by [Moment.js](https://momentjs.com/docs/#/displaying/format/). The file will rotate whenever the `%DATE%` in the provided format changes if

Examples:

```yaml
auditLog:
  rotate:
    # If you want rotations to occur every week for some reason. Example `%DATE$` = '2025-Jul-Week 30'
    dateFormat: 'YYYY-MMM-[Week] ww'
```

```yaml
auditLog:
  rotate:
    # If you want to rotate at noon and midnight
    dateFormat: 'YYYY-MM-DD-A'
```

By default, the `dateFormat` being used is in the `local` time of the system timezone. If you want to use `utc`, set the following:

```yaml
auditLog:
  rotate:
    utc: true # Default: False
```

We can also set a `maxSize` audit logs can be before a rotation is automatically triggered. The file rotation in this case will add a count (1,2,3,4,...) at the end of the filename when the required size is met. Ex: `redhat-developer-hub-audit-2024-07-22.log.3`.

By default no `maxSize` is configured. To configure `maxSize`, provide a number followed by one of `k`, `m`, or `g` to specify the file size in kilobytes, megabytes, or gigabytes.

```yaml
auditLog:
  rotate:
    maxSize: 100m
```

#### Configuring the file retention policy

By default, no files are deleted and no files are archived.

You can configure the max number of files to keep before log deletion of the oldest log begins by configuring `maxFilesOrDays` with a number:

```yaml
auditLog:
  rotate:
    maxFilesOrDays: 14 # Deletes the oldest log when there are more than 14 log files
```

You can also configure the max number of DAYS to keep files around by appending a `d` after the number. Note: this is mutually exclusive with the number of files configuration:

```yaml
auditLog:
  rotate:
    maxFilesOrDays: 5d # Deletes logs older than 5 days
```

You can also configure the audit logger to archive and compress rotated audit logs using `gzip` to save space:

```yaml
auditLog:
  rotate:
    zippedArchive: true # Default: false
```
