import { getConfig } from '@/config/configuration';
import {
  APP_CLUSTER_NAME,
  APP_ENV,
  APP_NAME,
  APP_REGION,
} from '@/config/constants';
import ClusterAclsNotLoadedError from '@/model/errors/ClusterAclsNotLoadedError';
import DatastoreNotAvailableError from '@/model/errors/DatastoreNotAvailableError';
import NoClustersAvailableError from '@/model/errors/NoClustersAvailableErrors';
import { getStore } from '@/model/store';
import { DatastoreType } from '@/typings/enums';
import { IClusterDefinition } from '@/typings/typings';
import { Application } from 'express';

const { ENVIRONMENTS, REGIONS } = getConfig();

/**
 * Gets the name of this application.
 * @param app The current Express app.
 * @returns Returns the current app name;
 */
export function getAppName(app: Application): string {
  return app.get(APP_NAME);
}

/**
 * Fetches the list of available clusters.
 * @param datastoreType The type of datastore to fetch clusters for.
 * @returns Returns an Array of cluster objects.
 */
export function getAvailableClusters(
  datastoreType: string,
): IClusterDefinition[] {
  const { discovery } = getStore();
  const { clusters } = discovery;
  if (!clusters || Object.keys(clusters).length === 0) {
    throw new NoClustersAvailableError(datastoreType);
  }
  const datastoreClusters = clusters[datastoreType];
  if (!datastoreClusters) {
    throw new DatastoreNotAvailableError(datastoreType);
  }
  return datastoreClusters;
}

export function getCluster(
  app: Application,
  datastoreType: DatastoreType,
  clusterName: string,
): IClusterDefinition {
  const clusters = getAvailableClusters(datastoreType);
  const localEnv = getEnv(app);
  const localRegion = getRegion(app);
  // TODO convert to map, avoid linear search
  return clusters.find(
    (cluster) =>
      cluster.name.toLowerCase() === clusterName.toLowerCase() &&
      cluster.env === localEnv &&
      cluster.region === localRegion,
  ) as IClusterDefinition;
}

/**
 * Gets the current environment (e.g. test or prod);
 * @param app The current Express app.
 * @returns Returns the current environment.
 */
export function getEnv(app: Application): string {
  return app.get(APP_ENV);
}

/**
 * Returns the name of this cluster. Note, the cluster name will include the stack name as well
 * (e.g. datatexplorer-stg).
 * @param app The current Express app.
 * @returns Returns the current cluster name.
 */
export function getAppStack(app: Application): string {
  return app.get(APP_CLUSTER_NAME);
}

/**
 * Gets the current AWS region (e.g. us-west-1);
 * @param app The current Express app.
 * @returns Returns the current AWS region.
 */
export function getRegion(app: Application): string {
  return app.get(APP_REGION);
}

/**
 * Fetches all defined regions. These are all the well-known regions which is likely a super-set
 * of all available regions.
 * @returns Returns an array of all the possible regions (valid or not).
 * @see getAvailableRegions
 */
export function getAllKnownRegions(): string[] {
  return REGIONS;
}

/**
 * Fetches all the known environments. These are the well-known environments which is likely
 * a superset of all available environments.
 */
export function getAllKnownEnvironments(): string[] {
  return ENVIRONMENTS;
}

export function isClusterShared(clusterName: string): boolean {
  const { accessControl } = getStore();
  const clusterAclMap = accessControl.clusterAclMap;
  if (!clusterAclMap) {
    throw new ClusterAclsNotLoadedError(clusterName);
  }
  const clusterACLDef = clusterAclMap[clusterName.toLowerCase()];
  if (!clusterACLDef) {
    return false;
  }
  return clusterACLDef.isShared;
}

/**
 * Helper method for checking if a region and environment is accessible by the current app.
 * For instance, this app might be running in us-east.
 * @param app The current Express app.
 * @param region The region to check.
 * @param env The environment to check.
 * @returns Returns true if the given region and env is accessible.
 */
export function isRegionAccessible(
  app: Application,
  region: string,
  env: string,
): boolean {
  return region === getRegion(app) && env === getEnv(app);
}
