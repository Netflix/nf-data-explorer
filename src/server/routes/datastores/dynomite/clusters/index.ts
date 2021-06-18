import { getExplorerCache } from '@/config/services';
import fields from '@/routes/datastores/dynomite/clusters/fields';
import keys from '@/routes/datastores/dynomite/clusters/keys';
import { IExplorer } from '@/services/datastores/base/datastore';
import DynomiteDatastoreService from '@/services/datastores/dynomite';
import DynomiteExplorer from '@/services/datastores/dynomite/lib/DynomiteExplorer';
import { DatastoreType } from '@/typings/enums';
import { IClusterDefinition } from '@/typings/typings';
import { verifyUserCanAccessCluster } from '@/utils/acl-utils';
import { getCluster, getEnv, getRegion } from '@/utils/app-utils';
import { Request, Router } from 'express';

const router = Router();
const dynomiteDatastoreService = new DynomiteDatastoreService();

/**
 * Extracts the cluster name from the path parameter (e.g. .../clusters/<my_cluster>/...).
 * Sets up an instance of the DynomiteExplorer API and attaches it to the request so downstream
 * requests can easily access it via req.dynomiteApi.
 */
router.param('cluster', async (req: Request, res, next, clusterName) => {
  if (!clusterName) {
    return res
      .status(400)
      .json({ message: 'clusterName must be provided in path param.' });
  }

  const datastoreType = DatastoreType.DYNOMITE;
  req.datastoreType = datastoreType;
  req.cluster = getCluster(req.app, req.datastoreType, clusterName);

  try {
    verifyUserCanAccessCluster(req.user, req.cluster);
    const explorerCache = getExplorerCache();
    req.dynomiteApi = (await explorerCache.getExplorer(
      datastoreType,
      clusterName,
      getRegion(req.app),
      getEnv(req.app),
      (cluster: IClusterDefinition): Promise<IExplorer> => {
        return dynomiteDatastoreService.connect(cluster);
      },
    )) as DynomiteExplorer;
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Fetch cluster information.
 */
router.get('/:cluster', async (req: Request, res, next) => {
  try {
    const keyCount = await req.dynomiteApi.getKeyCount();
    res.json({ totalKeys: keyCount });
  } catch (err) {
    next(err);
  }
});

router.use('/:cluster/keys', keys);
router.use('/:cluster/fields', fields);

export default router;
