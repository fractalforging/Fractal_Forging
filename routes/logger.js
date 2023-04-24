const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment-timezone');
const kleur = require('kleur');
const debug = require('debug')('myapp:debug');

// ENVIRONMENT VARIABLES
const dotenv = require("dotenv")
dotenv.config({ path: "variables.env" });
const location = process.env.LOCATION

const timestampInTimeZone = () => {
  return kleur.cyan(moment.tz(new Date(), 'Europe/' + location).format('DD/MM/YYYY HH:mm:ss'));
};

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: '_logs/' + moment().format('MM-YYYY') + '/%DATE%.log',
  datePattern: 'DD-MM-YYYY',
  maxSize: '100m',
  maxFiles: '360d',
});

const logger = createLogger({
  level: 'debug', // set log level to debug
  format: format.combine(
    format.timestamp({ format: timestampInTimeZone }),
    format.printf(({ timestamp, level, message }) => {
      let colorizedLevel;
      switch (level) {
        case 'info':
          colorizedLevel = kleur.green(level);
          break;
        case 'error':
          colorizedLevel = kleur.red(level);
          break;
        case 'warn':
          colorizedLevel = kleur.yellow(level);
          break;
        case 'debug':
          colorizedLevel = kleur.magenta(level);
          break;
        default:
          colorizedLevel = level;
      }
      return `[${timestamp}] ${colorizedLevel}: ${message}`;
    })
  ),
  transports: [dailyRotateFileTransport, new transports.Console()],
});

debug('Debug log message'); // output debug log message to console

module.exports = logger;
