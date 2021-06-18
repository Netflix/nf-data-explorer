import ClusterAccessControlService from '@/services/cluster-acls/ClusterAccessControlService';
import ClusterAccessControlProvider from '@/services/cluster-acls/providers/ClusterAccessControlProvider';
import { State } from '@/typings/enums';
import { IStore } from '@/typings/store';
import { IClusterAClMap } from '@/typings/typings';
import {
  getAllKnownEnvironments,
  getAllKnownRegions,
  getEnv,
  getRegion,
} from '@/utils/app-utils';
import { loadClass } from '@/utils/class-loader-utils';
import { Application } from 'express';
import { getConfig } from '../configuration';
import loggerFactory from '../logger';

const { CLUSTER_ACCESS_CONTROL_SERVICE_PROVIDER } = getConfig();

const logger = loggerFactory(module);

async function getClusterAccessControlProvider(
  app: Application,
): Promise<ClusterAccessControlProvider> {
  if (!CLUSTER_ACCESS_CONTROL_SERVICE_PROVIDER) {
    throw new Error(
      'CLUSTER_ACCESS_CONTROL_SERVICE_PROVIDER not specified in configuration.',
    );
  }

  const EntityAccessControlLoaderClass = await loadClass<
    new (
      environments: string[],
      regions: string[],
      currentEnvironment: string,
      currentRegion: string,
    ) => ClusterAccessControlProvider
  >(
    `@/services/cluster-acls/providers/${CLUSTER_ACCESS_CONTROL_SERVICE_PROVIDER}`,
  );
  // TODO revisit global state
  return new EntityAccessControlLoaderClass(
    getAllKnownEnvironments(),
    getAllKnownRegions(),
    getEnv(app),
    getRegion(app),
  );
}

/**
 * Sets up and starts the access control service which polls the specified
 * provider to fetch the mapping of clusters to allowed users/groups.
 * @param app The Express application.
 */
export async function setupClusterAccessControlService(
  app: Application,
  store: IStore,
): Promise<ClusterAccessControlService> {
  const dataAccessControlService = new ClusterAccessControlService();

  dataAccessControlService.use(await getClusterAccessControlProvider(app));
  const { accessControl } = store;
  accessControl.status = State.LOADING;

  dataAccessControlService.on('loaded', (clusterAclMap: IClusterAClMap) => {
    accessControl.clusterAclMap = clusterAclMap;
    accessControl.status = State.SUCCESS;
  });
  dataAccessControlService.on('error', (err) => {
    logger.error(
      'failed fetch cluster access control information',
      err.message,
    );
    accessControl.status = State.ERROR;
  });
  return dataAccessControlService;
}
