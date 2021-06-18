import {
  APP_CLUSTER_NAME,
  APP_ENV,
  APP_NAME,
  APP_REGION,
} from '@/config/constants';
import { Application } from 'express';

export const setupEnv = (app: Application): void => {
  // TODO revisit environment variables
  app.set(APP_REGION, 'us-east-1');
  app.set(APP_ENV, 'test');
  app.set(APP_NAME, 'nf-data-explorer-2');
  app.set(APP_CLUSTER_NAME, 'nfdataexplorer2');
};
