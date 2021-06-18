import setupLogger from '@/config/logger';
import FileUploadError, { IMulterError } from '@/model/errors/FileUploadError';
import HttpStatusError from '@/model/errors/HttpStatusError';
import ClusterConnectionError from '@/services/datastores/base/errors/ClusterConnectionError';
import CassandraAuthenticationError from '@/services/datastores/cassandra/lib/errors/CassandraAuthenticationError';
import CassandraNoHostAvailableError from '@/services/datastores/cassandra/lib/errors/CassandraNoHostAvailableError';
import { getAppName } from '@/utils/app-utils';
import { types } from 'cassandra-driver';
import { Express, NextFunction, Request, Response } from 'express';
import multer from 'multer';

const logger = setupLogger(module);

function buildErrorResponse(
  req: Request,
  err: HttpStatusError,
  isDevMode = false,
) {
  let e = err;
  if (e.message.indexOf('Connection is closed') >= 0) {
    logger.info('Caught a Redis connection error');
    e = new ClusterConnectionError(req.cluster.name, getAppName(req.app));
  }
  if (e instanceof (multer as any).MulterError) {
    e = new FileUploadError((e as unknown) as IMulterError);
  }
  if (e instanceof (types as any).DriverError) {
    if (
      e.message.toLowerCase().indexOf('authentication provider not set') >= 0
    ) {
      e = new CassandraAuthenticationError(req.cluster.name);
    } else if (e.name === 'NoHostAvailableError') {
      e = new CassandraNoHostAvailableError(req.cluster.name);
    }
  }
  if (isDevMode) {
    // use console logger here to make stack traces easier to read in dev mode
    // tslint:disable-next-line
    console.error(e);
  }
  return {
    status: e.status || 500,
    title: e.title,
    message: e.message,
    remediation: e.remediation,
    error: isDevMode ? e.stack : {},
  };
}

export function setupErrorHandlers(app: Express): void {
  // catch 404 and forward to error handler
  app.use((_req, _res, next) => {
    next(new HttpStatusError(404, 'Not Found', 'Not Found'));
  });

  // error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(
      (
        err: HttpStatusError,
        req: Request,
        res: Response,
        _next: NextFunction,
      ) => {
        const errResp = buildErrorResponse(req, err, true);
        res.status(errResp.status || 500).json(errResp);
      },
    );
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(
    (
      err: HttpStatusError,
      req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      const status = err.status;
      if (status && status >= 400 && status <= 499) {
        logger.info(err.message);
      } else {
        logger.error(err.message);
      }

      const errResp = buildErrorResponse(req, err, false);
      res.status(errResp.status || 500).json(errResp);
    },
  );
}
