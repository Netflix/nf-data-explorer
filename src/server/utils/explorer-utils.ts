import { getExplorerCache } from '@/config/services';
import { IExplorer } from '@/services/datastores/base/datastore';
import { DatastoreType } from '@/typings/enums';
import { IClusterDefinition } from '@/typings/typings';
import { Request } from 'express';
import { verifyUserCanAccessCluster } from './acl-utils';
import { getCluster, getEnv, getRegion } from './app-utils';

/**
 * Utility method for fetching an Explorer instance for the given datastore using a cache-first method.
 * In case of a cache-miss, the `createExplorerCb` will be called to create the instance and add it to the cache.
 * Also enforces that the user has the access-rights necessary to acccess the given cluster.
 * @param req               The user's request object.
 * @param datastoreType     The datastore type to lookup.
 * @param clusterName       The name of the cluster to lookup.
 * @param createExplorerCb  The callback that will be called with the ClusterDefinition if found.
 *                          Expected to return an appropriate explorer instance configured for
 *                          the given cluster.
 */
export function getExplorerForDatastore(
  req: Request,
  datastoreType: DatastoreType,
  clusterName: string,
  createExplorerCb: (cluster: IClusterDefinition) => Promise<IExplorer>,
): Promise<IExplorer> {
  const region = getRegion(req.app);
  const env = getEnv(req.app);

  const cluster = getCluster(req.app, datastoreType, clusterName);
  req.datastoreType = datastoreType;
  req.cluster = cluster;
  verifyUserCanAccessCluster(req.user, req.cluster);

  const explorerCache = getExplorerCache();
  return explorerCache.getExplorer(
    datastoreType,
    clusterName,
    region,
    env,
    createExplorerCb,
  );
}
