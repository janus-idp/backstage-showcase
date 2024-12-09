import { WinstonLogger } from '@backstage/backend-defaults/rootLogger';
import type { Config } from '@backstage/config';

import * as winston from 'winston';

const defaultFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
);

const auditLogFormat = winston.format((info, opts) => {
  const { isAuditLog, ...newInfo } = info;

  if (isAuditLog) {
    // keep `isAuditLog` field
    return opts.isAuditLog ? info : false;
  }

  // remove `isAuditLog` field from non audit log events
  return !opts.isAuditLog ? newInfo : false;
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
};

export const createStaticLogger = ({ service }: { service: string }) => {
  const logger = WinstonLogger.create({
    meta: {
      service,
    },
    level: process.env.LOG_LEVEL || 'info',
    format:
      process.env.NODE_ENV === 'production'
        ? defaultFormat
        : WinstonLogger.colorFormat(),
    transports: transports.log,
  });
  return logger;
};
