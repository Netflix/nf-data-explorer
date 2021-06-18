/* eslint-disable @typescript-eslint/no-var-requires */
require('module-alias/register');
// need this to be synchronous and initialized first
require('@/config/configuration').init();
// logger depends on configuration and must be setup before all other services
require('@/config/logger').init();
// loading i18n support up front simplifies usage in the rest of the app
require('@/i18n').setupi18n();

import { setupErrorHandlers } from '@/config/error-handlers';
import loggerFactory from '@/config/logger';
import { setupMiddleware } from '@/config/middlewares';
import { setupServices } from '@/config/services';
import { setupEnv } from '@/config/setup-env';
import routes from '@/routes';
import express, { Application, Request, Response } from 'express';
import noCache from 'nocache';
import { join } from 'path';
import { getConfig } from './config/configuration';
import { getStore } from './model/store';
import { State } from './typings/enums';

const { APP_NAME, APP_PORT } = getConfig();

const logger = loggerFactory(module);

const app = express();

setupEnv(app);

function healthcheck(_req: Request, res: Response) {
  const { discovery } = getStore();
  const { clusters, status: discoveryStatus } = discovery;
  const noClustersFound = !clusters || Object.keys(clusters).length === 0;

  const { accessControl } = getStore();
  const { status: aclStatus, clusterAclMap } = accessControl;
  const noAclInfo = !clusterAclMap || Object.keys(clusterAclMap).length === 0;

  if (discoveryStatus === State.LOADING || aclStatus === State.LOADING) {
    return res.status(204).send();
  } else if (noClustersFound && discoveryStatus === State.ERROR) {
    return res
      .status(500)
      .send('No clusters found and last discovery attempt failed.');
  } else if (noAclInfo && aclStatus === State.ERROR) {
    return res
      .status(500)
      .send(
        'No cluster access control information found and last retrieval attempt failed.',
      );
  } else if (discoveryStatus === State.ERROR) {
    return res.status(203).send('Last discovery attempt failed.');
  } else if (aclStatus === State.ERROR) {
    return res.status(203).send('Last ACL request attempt failed.');
  }

  return res.status(200).send('OK!');
}

const appPromise: Promise<Application> = new Promise((resolve, reject) => {
  setupServices(app)
    .then(() => {
      app.get('/healthcheck', noCache(), healthcheck);

      setupMiddleware(app);
      app.use('/REST', noCache(), routes);

      // serve all other routes from index.html to enable client-side routing.
      app.get('*', (req, res) => {
        if (req.url.match(/^\/static\/(js|css|fonts)\//)) {
          res.status(404).send();
        } else {
          res.header('Cache-Control', 'no-cache');
          res.sendFile(join(__dirname, 'public', 'index.html'));
        }
      });

      setupErrorHandlers(app);

      // don't start the server in test mode since tests are run in parallel
      // and we only need the app to be created and we can forgo the server
      if (process.env.NODE_ENV !== 'test') {
        app.listen(APP_PORT, () => {
          logger.info(`${APP_NAME} listening on port ${APP_PORT}!`);
        });
      }

      resolve(app);
    })
    .catch((err) => {
      logger.error(`Startup failed due to: ${err.message}`);
      reject();
      process.exit(1);
    });
});

// needed for tests to know when the app has started
export function getApp(): Promise<Application> {
  return appPromise;
}
