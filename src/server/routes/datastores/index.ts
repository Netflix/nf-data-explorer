import { getConfig } from '@/config/configuration';
import setupLogger from '@/config/logger';
import { getStore } from '@/model/store';
import { DatastoreType } from '@/typings/enums';
import { canUserAccessCluster } from '@/utils/acl-utils';
import {
  getAvailableClusters,
  isClusterShared,
  isRegionAccessible,
} from '@/utils/app-utils';
import { getQueryAsString } from '@/utils/request-utils';
import { IClusterRegionSummary, IClusterSummary } from '@sharedtypes/typings';
import { Request, Router } from 'express';
import { flatten } from 'lodash';

const { SUPPORTED_DATASTORE_TYPES } = getConfig();

const router = Router();

const logger = setupLogger(module);

const supportedDatstores = SUPPORTED_DATASTORE_TYPES;
const supportedDatastoreRegex = supportedDatstores.join('|');

logger.info(
  `setting up sub-routes for supported datastores: ${JSON.stringify(
    supportedDatstores,
  )}`,
);

router.param('datastoreType', (req: Request, res, next) => {
  // store the datastore type on the request (used for logging)
  req.datastoreType =
    DatastoreType[(req.params.datastoreType as string).toUpperCase()];
  next();
});

/**
 * Fetches the list of all datastore clusters the current user has access to.
 */
router.get('/', (req: Request, res, next) => {
  try {
    const allDatastoreClusters: IClusterRegionSummary[] = flatten(
      Object.values(getStore().discovery.clusters || []),
    ).map(
      (clusterDef) =>
        ({
          env: clusterDef.env,
          isShared: isClusterShared(clusterDef.name),
          name: clusterDef.name,
          region: clusterDef.region,
          type: clusterDef.datastoreType,
        } as IClusterRegionSummary),
    );

    if (!allDatastoreClusters || allDatastoreClusters.length === 0) {
      return res.status(204).json({ message: 'No clusters available.' });
    }

    const userAccessibleClusters = allDatastoreClusters.filter((cluster) =>
      canUserAccessCluster(req.user, cluster),
    );
    return res.json(userAccessibleClusters);
  } catch (err) {
    next(err);
  }
});

/**
 * Fetches the list of Datastore clusters in the current region for this application.
 */
router.get(
  `/:datastoreType(${supportedDatastoreRegex})/clusters`,
  (req: Request, res, next) => {
    try {
      const clusters = getAvailableClusters(req.params.datastoreType);
      if (!clusters || clusters.length === 0) {
        return res.status(204).json({ message: 'No clusters available.' });
      }

      const match = getQueryAsString(req, 'match', '*');

      const accessibleClusters = new Set<IClusterSummary>();
      clusters.forEach((cluster) => {
        const isAccessible = isRegionAccessible(
          req.app,
          cluster.region,
          cluster.env,
        );
        const nameMatches =
          match.trim() === '*' ||
          cluster.name
            .toLowerCase()
            .indexOf(match.toLowerCase().replace(/\*/g, '')) >= 0;
        if (
          isAccessible &&
          nameMatches &&
          canUserAccessCluster(req.user, cluster)
        ) {
          accessibleClusters.add({
            name: cluster.name,
            isShared: isClusterShared(cluster.name),
          });
        }
      });
      return res.json(Array.from(accessibleClusters));
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Intended to be a fast endpoint that simply checks the existence of a cluster and returns a 200 or 404.
 */
router.head(
  `/:datastoreType(${supportedDatastoreRegex})/clusters/:name`,
  (req, res, next) => {
    try {
      const clusters = getAvailableClusters(req.params.datastoreType);
      const clusterExists = clusters.some(
        (cluster) => cluster.name === req.params.name,
      );
      res.status(clusterExists ? 204 : 404).send();
    } catch (err) {
      next(err);
    }
  },
);

router.get('/types', (_req, res, _next) => {
  res.json(supportedDatstores);
});

supportedDatstores.forEach(async (datastore) => {
  const datastoreRoute = await import(`./${datastore}`);
  router.use(`/${datastore}`, datastoreRoute.default);
});

export default router;
