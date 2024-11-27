import { createLogger, transports, format } from "winston";

function dumpData(dump) {
  if (!dump) {
    return "";
  }
  if (typeof dump == "string") {
    return dump;
  } else if (typeof dump == "object") {
    return JSON.stringify(dump);
  }
}

const myFormat = format.printf(({ level, message, timestamp, dump }) => {
  return `${timestamp} ${level}: ${message} ${dumpData(dump)}`;
});

export const LOGGER = createLogger({
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
    myFormat,
  ),
  transports: [
    new transports.File({
      filename: `test-logs.log`,
      dirname: process.env.CI ? process.env.ARTIFACTS_DIR : "/tmp",
    }),
  ],
});
