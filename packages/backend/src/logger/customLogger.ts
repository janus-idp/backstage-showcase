import type { Config } from '@backstage/config';

import * as winston from 'winston';

import 'winston-daily-rotate-file';

const defaultFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
);

// Define the type for `opts`
interface AuditLogFormatOptions {
  isAuditLog: boolean;
}

const auditLogFormat = winston.format((info, opts) => {
  const { isAuditLog, ...newInfo } = info;

  const options = opts as AuditLogFormatOptions;

  if (isAuditLog) {
    // keep `isAuditLog` field
    return options.isAuditLog ? info : false;
  }

  // remove `isAuditLog` field from non audit log events
  return !options.isAuditLog ? newInfo : false;
});

const auditLogWinstonFormat = winston.format.combine(
  auditLogFormat({ isAuditLog: true }),
  defaultFormat,
  winston.format.json(),
);

export const transports = {
  log: [
    new winston.transports.Console({
      format: winston.format.combine(
        auditLogFormat({ isAuditLog: false }),
        defaultFormat,
        winston.format.json(),
      ),
    }),
  ],
  auditLog: (config?: Config) => {
    if (config?.getOptionalBoolean('console.enabled') === false) {
      return [];
    }
    return [
      new winston.transports.Console({
        format: auditLogWinstonFormat,
      }),
    ];
  },
  auditLogFile: (config?: Config) => {
    if (!config?.getOptionalBoolean('rotateFile.enabled')) {
      return [];
    }
    return [
      new winston.transports.DailyRotateFile({
        format: auditLogWinstonFormat,
        dirname:
          config?.getOptionalString('rotateFile.logFileDirPath') ??
          '/var/log/redhat-developer-hub/audit',
        filename:
          config?.getOptionalString('rotateFile.logFileName') ??
          'redhat-developer-hub-audit-%DATE%.log',
        datePattern: config?.getOptionalString('rotateFile.dateFormat'),
        frequency: config?.getOptionalString('rotateFile.frequency'),
        zippedArchive: config?.getOptionalBoolean('rotateFile.zippedArchive'),
        utc: config?.getOptionalBoolean('rotateFile.utc'),
        maxSize: config?.getOptionalString('rotateFile.maxSize'),
        maxFiles: config?.getOptional('rotateFile.maxFilesOrDays'),
      }),
    ];
  },
};
