const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment-timezone');
const kleur = require('kleur');

// ENVIRONMENT VARIABLES
const dotenv = require("dotenv")
dotenv.config({ path: "variables.env" });
const location = process.env.LOCATION

const timestampInTimeZone = () => {
  return kleur.yellow(moment.tz(new Date(), 'Europe/' + location).format('DD/MM/YYYY HH:mm:ss'));
};

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: '_logs/' + moment().format('MM-YYYY') + '/%DATE%.log',
  datePattern: 'DD-MM-YYYY',
  maxSize: '100m',
  maxFiles: '360d',
});

const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: timestampInTimeZone }),
    format.printf(({ timestamp, level, message }) => {
      let colorizedLevel;
      switch (level) {
        case 'info':
          colorizedLevel = kleur.grey(level);
          break;
        case 'error':
          colorizedLevel = kleur.red(level);
          break;
        case 'warn':
          colorizedLevel = kleur.yellow(level);
          break;
        default:
          colorizedLevel = level;
      }
      return `[${timestamp}] ${colorizedLevel}: ${message}`;
    })
  ),
  transports: [dailyRotateFileTransport, new transports.Console()],
});

module.exports = logger;
