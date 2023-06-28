import { createLogger, format, transports } from 'winston';
import moment from 'moment-timezone';
import kleur from 'kleur';
import debug from 'debug';
import DailyRotateFile from 'winston-daily-rotate-file';
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';
dotenv.config({ path: "variables.env" });

const location = process.env.LOCATION;

const timestampInTimeZone = () => {
  return kleur.cyan(moment.tz(new Date(), 'Europe/' + location).format('DD/MM/YYYY HH:mm:ss'));
};

const loggerRoute = createLogger({
  level: 'debug',
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
  transports: [new transports.Console()],
});

const logLevels = ['info', 'error', 'warn', 'debug'];

const customLog = {};
logLevels.forEach((level) => {
  customLog[level] = (message, info = {}) => {
    if (info.username === 'admin') {
      return;
    }
    const logDirectory = '_logs/' + moment().format('YYYY') + moment().format('/MM');
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory, { recursive: true });

    const dailyRotateFileTransport = new DailyRotateFile({
      filename: path.join(logDirectory, '/%DATE%.log'),
      datePattern: 'DD-MM-YYYY',
      maxSize: '100m',
      maxFiles: '360d',
    });

    loggerRoute.add(dailyRotateFileTransport);
    loggerRoute.log(level, message);
    loggerRoute.remove(dailyRotateFileTransport);
  };
});

debug('Debug log message');

export { customLog as default };
