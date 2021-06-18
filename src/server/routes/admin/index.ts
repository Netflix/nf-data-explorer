import { APP_AVAIL_ENVIRONMENTS, APP_AVAIL_REGIONS } from '@/config/constants';
import setupLogger from '@/config/logger';
import {
  getEntityAccessControlCache,
  getExplorerCache,
  getUserGroupCache,
} from '@/config/services';
import { getStore } from '@/model/store';
import { DatastoreType } from '@/typings/enums';
import {
  IAdminStatus,
  IClusterDefinitionWithConnectionInfoMap,
  IClusterDefinition,
} from '@/typings/typings';
import * as appUtils from '@/utils/app-utils';
import { Router } from 'express';

const logger = setupLogger(module);
const router = Router();

/**
 * Get application status information at runtime.
 */
router.get('/status', async (req, res) => {
  const app = req.app;

  const cache = getEntityAccessControlCache();
  if (req.query.refresh === 'true') {
    await cache.refresh();
  }

  const { accessControl, discovery } = getStore();
  const { status: aclStatus, clusterAclMap } = accessControl;
  const { status: discoveryStatus } = discovery;

  const availableClustersWithConnections = buildClustersWithConnectionInfo();
  logger.info('querying admin status', req);
  res.json({
    currentRegion: appUtils.getRegion(app),
    currentEnv: appUtils.getEnv(app),
    state: {
      discovery: discoveryStatus,
      acl: aclStatus,
    },
    acl: clusterAclMap,
    available: {
      environments: app.get(APP_AVAIL_ENVIRONMENTS),
      regions: app.get(APP_AVAIL_REGIONS),
      clusters: availableClustersWithConnections,
    },
    cache: cache.values(),
    userCache: getUserGroupCache().values(),
  } as IAdminStatus);
});

function buildClustersWithConnectionInfo() {
  const availableClustersWithConnections = {} as IClusterDefinitionWithConnectionInfoMap;

  const { discovery } = getStore();
  const availableClusters = discovery.clusters;
  if (availableClusters) {
    const datastoreTypes = Object.keys(availableClusters);
    datastoreTypes.forEach((type) => {
      availableClustersWithConnections[type] = availableClusters[type].map(
        mapCluster,
      );
    });
  }
  return availableClustersWithConnections;
}

function mapCluster(cluster: IClusterDefinition) {
  const datastoreType = DatastoreType[cluster.datastoreType.toUpperCase()];
  const explorerCache = getExplorerCache();
  const explorer = explorerCache.peekExplorer(
    datastoreType,
    cluster.name,
    cluster.region,
    cluster.env,
  );
  return {
    ...cluster,
    hasConnection: !!explorer,
  };
}

export default router;
