import { getConfig } from '@/config/configuration';
import {
  APP_CLUSTER_NAME,
  APP_ENV,
  APP_NAME,
  APP_REGION,
} from '@/config/constants';
import { Application } from 'express';
import loggerFactory from './logger';

const logger = loggerFactory(module);

const {
  ENV_VAR_APP_NAME,
  ENV_VAR_APP_CLUSTER,
  ENV_VAR_ENV,
  ENV_VAR_REGION,
  ENVIRONMENTS,
  REGIONS,
} = getConfig();

export function setupEnv(app: Application): void {
  if (process.env[ENV_VAR_ENV]) {
    app.set(APP_ENV, process.env[ENV_VAR_ENV]);
  } else {
    if (ENVIRONMENTS.length === 0) {
      throw new Error('At least one environment must be defined.');
    }

    logger.info(`Defaulting to environment: ${ENVIRONMENTS[0]}`);
    app.set(APP_ENV, ENVIRONMENTS[0]);
  }

  if (process.env[ENV_VAR_REGION]) {
    app.set(APP_REGION, process.env[ENV_VAR_REGION]);
  } else {
    if (REGIONS.length === 0) {
      throw new Error('At least one region must be defined.');
    }
    logger.info(`Defaulting to region: ${REGIONS[0]}`);
    app.set(APP_REGION, REGIONS[0]);
  }

  app.set(APP_NAME, process.env[ENV_VAR_APP_NAME] || 'nfdataexplorer2');
  app.set(
    APP_CLUSTER_NAME,
    process.env[ENV_VAR_APP_CLUSTER] || 'nfdataexplorer2',
  );

  logger.info(`Using APP_ENV: ${app.get(APP_ENV)}`);
  logger.info(`Using APP_REGION: ${app.get(APP_REGION)}`);
  logger.info(`Using APP_NAME: ${app.get(APP_NAME)}`);
  logger.info(`Using APP_CLUSTER_NAME: ${app.get(APP_CLUSTER_NAME)}`);
}
