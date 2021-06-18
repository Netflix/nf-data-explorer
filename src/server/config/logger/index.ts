import { Request } from 'express';
import http from 'http';
import path from 'path';
import winston, { createLogger } from 'winston';
import { getConfig } from '../configuration';
import { ILoggerProvider } from './providers/ILoggerProvider';

const { LOGGER_PROVIDER } = getConfig();

const logLevel = process.env.LOG_LEVEL || 'info';
const isProd =
  process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test';

let logger: winston.Logger;

/**
 * Initializes the logger. Must be called early in the startup lifecycle in order
 * for other services to use it.
 */
export function init(): void {
  const path = `@/config/logger/providers/${LOGGER_PROVIDER}`;

  // note, we use a synchronous require rather than the standard loadClass()
  // that uses promises as it needs to be called synchronously in the startup sequence
  // before it is used.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Provider: new () => ILoggerProvider = require(path).default;
  logger = createLogger({
    level: logLevel,
    transports: new Provider().getTransports(isProd),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function loggerFactory(module: any): ILogger {
  if (!logger) {
    throw new Error(
      'Logger not initialized. Please call initLogger() before first use.',
    );
  }
  if (!module) {
    throw new Error('The module name is required to log.');
  }

  const rootDir = path.join(__dirname, '..', '..', '..');
  const filename = module.id.slice(rootDir.length);

  const internalLog = (level: string, message: string, metadata: any) => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const params = { location: filename };
    if (metadata instanceof http.IncomingMessage) {
      const req: Request = metadata as Request;

      Object.assign(params, {
        cluster: req?.cluster?.name ?? '',
        datastoreType: req.datastoreType ?? '',
        route: req.originalUrl ?? '',
        clientApp: req?.user?.application ?? '',
        user: {
          email: req?.user?.email ?? '',
        },
      });
    }
    logger.log(level, message, params);
  };

  return {
    /**
     * Logs an info level message.
     * @param message     The message to be logged.
     * @param metadata    Additional metadata to be logged.
     */
    info(message: string, metadata?: any) {
      internalLog('info', message, metadata);
    },

    /**
     * Logs a debug level message.
     * @param message     The message to be logged.
     * @param metadata    Additional metadata to be logged.
     */
    debug(message: string, metadata?: any) {
      internalLog('debug', message, metadata);
    },

    /**
     * Logs an error level message.
     * @param message     The message to be logged.
     * @param metadata    Additional metadata to be logged.
     */
    error(message: string, metadata?: any) {
      internalLog('error', message, metadata);
    },

    /**
     * Logs a warning level message
     * @param message     The message to be logged.
     * @param metadata    Additional metadata to be logged.
     */
    warn(message: string, metadata?: any) {
      internalLog('warn', message, metadata);
    },
  };
}
