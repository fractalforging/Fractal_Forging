import { createLogger, format, transports } from 'winston';
import moment from 'moment-timezone';
import kleur from 'kleur';
import debug from 'debug';
import DailyRotateFile from 'winston-daily-rotate-file';
import dotenv from "dotenv";
dotenv.config({ path: "variables.env" });

const location = process.env.LOCATION;

const timestampInTimeZone = () => {
  return kleur.cyan(moment.tz(new Date(), 'Europe/' + location).format('DD/MM/YYYY HH:mm:ss'));
};

const dailyRotateFileTransport = new DailyRotateFile({
  filename: '_logs/' + moment().format('YYYY') + moment().format('/MM') + '/%DATE%.log',
  datePattern: 'DD-MM-YYYY',
  maxSize: '100m',
  maxFiles: '360d',
}); 

const loggerRoute = createLogger({
  level: 'debug',
  format: format.combine(
    format(info => {
      if (info.username === 'admin') {
        return false;
      }
      return info;
    })(),
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

debug('Debug log message');

export default loggerRoute;
