import winston, { transports } from "winston";
import {ENV_CONFIG} from "./config.js";

const customLevelsOptions = {
    levels:{
      fatal:0,
      error:1,
      warn:2,
      info:3,
      http:4,
      debug:5,
    },
    colors:{
      fatal: 'red',
      error: 'red',
      warn: 'yellow',
      info: 'blue',
      http: 'cyan',
      debug: 'white',
    }
};
winston.addColors(customLevelsOptions.colors);
export const devLogger = winston.createLogger({
    levels: customLevelsOptions.levels,
    transports: [
        new winston.transports.Console(
            {
                level: "debug",
                format: winston.format.combine(
                    winston.format.colorize({colors: customLevelsOptions.colors}),
                    winston.format.simple()
                )
            }
        ),
        new winston.transports.File(
            {
                filename: './errors.log', 
                level: 'warning', 
                format: winston.format.simple()
            }
        )
    ]
});

const prodLogger = winston.createLogger({
    levels: customLevelsOptions.levels,
    transports: [
        new winston.transports.Console(
            {
                level: "info",
                format: winston.format.combine(
                    winston.format.colorize({colors: customLevelsOptions.colors}),
                    winston.format.simple()
                )
            }
        ),
        new winston.transports.File({filename: './errors.log', level: 'warn'})
    ]
});


export const addLogger = (req, res, next) => {
    if (ENV_CONFIG.environment === 'production'){
        req.logger = prodLogger;
    } else {
        req.logger = devLogger;
    }
    req.logger.info(`${req.method} en ${req.url} - at ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`);
    next();
};

