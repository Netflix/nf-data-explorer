import setupLogger from '@/config/logger';
import { IExplorer } from '@/services/datastores/base/datastore';
import ClusterNotFoundError from '@/services/datastores/base/errors/ClusterNotFoundError';
import { DatastoreType } from '@/typings/enums';
import { IClusterDefinition } from '@/typings/typings';
import LRU from 'lru-cache';

const logger = setupLogger(module);
const TTL = 1000 * 60 * 10;

/**
 * Maintains a cache of discovery information as well as any cached explorer instances that are connected
 * to the back-end datastores.
 *
 * @singleton
 */
export default class ExplorerCache {
  private discoveryCache = new Map<string, IClusterDefinition>();
  private explorerCache: LRU<string, IExplorer>;

  public constructor() {
    this.explorerCache = new LRU<string, IExplorer>({
      maxAge: TTL,
      noDisposeOnSet: true,
      dispose: async (key, explorer) => {
        // the cache contains all the cached hosts and optionally, an Explorer instance if a connection
        // has been established. if the TTL has been reached, we'll shutdown connections to the cluster
        logger.info(`evicting ${key}`);
        if (explorer) {
          logger.info(`  shutdown connections to: ${key}`);
          try {
            await explorer.shutdown();
          } catch (err) {
            logger.error(
              `    shutdown of ${key} connections failed with: ${err.message}`,
            );
          }
        }
      },
    });

    // by default, keys are only pruned on get(). we want to make sure connections are garbage collected
    setInterval(() => {
      logger.info('pruning explorer cache...');
      this.explorerCache.prune();
    }, TTL);
  }

  /**
   * Updates the cache of clusters. Will replace all saved cluster definitions for the given datastore type.
   * @param datastoreType The type of datastores (e.g. 'cassandra').
   * @param clusters      The list of cluster definitions.
   */
  public updateClusters(
    datastoreType: DatastoreType,
    clusters: IClusterDefinition[],
  ): void {
    clusters.forEach((cluster) => {
      const key = this.getKey(
        datastoreType,
        cluster.name,
        cluster.region,
        cluster.env,
      );
      this.discoveryCache.set(key, cluster);
    });
  }

  /**
   * Fetches an existing Explorer instance for a given cluster without affecting the recent-ness of
   * the cache or attempting to create a new explorer on a cache miss.
   * @param datastoreType The type of datastore.
   * @param clusterName   The name of the cluster.
   * @param region        The region of this cluster.
   * @param env           The environment of this cluster.
   */
  public peekExplorer(
    datastoreType: DatastoreType,
    clusterName: string,
    region: string,
    env: string,
  ): IExplorer | undefined {
    const key = this.getKey(datastoreType, clusterName, region, env);
    const cluster = this.discoveryCache.get(key);
    if (!cluster) {
      logger.error(
        'cluster not present in the cache. server may still be starting up...',
      );
      throw new ClusterNotFoundError(clusterName, region, env);
    }
    return this.explorerCache.peek(key);
  }

  /**
   * Fetches an explorer instance for a given cluster. Will return a cached instance if available,
   * otherwise a new instance will be created using the provided callback.
   * @param datastoreType The type of datastore.
   * @param clusterName   The name of the cluster.
   * @param region        The region of this cluster.
   * @param env           The environment of this cluster.
   * @param explorerCb    The callback used to create the appropriate explorer instance.
   */
  public async getExplorer(
    datastoreType: DatastoreType,
    clusterName: string,
    region: string,
    env: string,
    createExplorerCb: (cluster: IClusterDefinition) => Promise<IExplorer>,
  ): Promise<IExplorer> {
    const key = this.getKey(datastoreType, clusterName, region, env);

    // first check to see if this cluster is in our discovery cache
    const cluster = this.discoveryCache.get(key);
    if (!cluster) {
      logger.error(
        'cluster not present in the cache. server may still be starting up...',
      );
      throw new ClusterNotFoundError(clusterName, region, env);
    }

    // use the cached explorer if available, otherwise create a new connection
    let explorer = this.explorerCache.get(key);
    if (!explorer) {
      const clusterDescription = `${clusterName}.${region}.${env}`;
      logger.info(
        `no existing client connection for cluster: ${clusterDescription}`,
      );
      explorer = await createExplorerCb(cluster);
    } else {
      logger.info('using existing client connection...');
    }

    // update the cached entry to update the access time
    this.explorerCache.set(key, explorer);
    return explorer;
  }

  private getKey(
    type: DatastoreType,
    clusterName: string,
    region: string,
    env: string,
  ) {
    return [type, env, region, clusterName]
      .map((item) => item.toLowerCase())
      .join(':::');
  }
}
