import { createLogger, transports, format } from 'winston';

const myFormat = format.printf(({ level, message, timestamp, dump }) => {
  return `${timestamp} ${level}: ${message} ${dump ? dump : ''}`;
});

export const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
    myFormat,
  ),
  transports: [
    new transports.File({
      filename: `authentication-providers.log`,
      dirname: process.env.CI ? process.env.ARTIFACTS_DIR : '/tmp',
    }),
  ],
});
