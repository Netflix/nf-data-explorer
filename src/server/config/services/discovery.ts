import setupLogger from '@/config/logger';
import { IDatastoreService } from '@/services/datastores/base/datastore';
import { DiscoveryService } from '@/services/discovery';
import BaseDiscoveryProvider from '@/services/discovery/providers/BaseDiscoveryProvider';
import ExplorerCache from '@/services/explorer/ExplorerCache';
import { DatastoreType, State } from '@/typings/enums';
import { IStore } from '@/typings/store';
import { IClusterDefinition, IDiscoveryMap } from '@/typings/typings';
import { loadClass } from '@/utils/class-loader-utils';
import { chain, forEach } from 'lodash';
import { getConfig } from '../configuration';

const logger = setupLogger(module);
const { DISCOVERY_PROVIDER, SUPPORTED_DATASTORE_TYPES } = getConfig();

/**
 * Get the appropriate discovery provider.
 * @param app Handle to the Express application.
 * @returns Returns the appropriate DiscoveryProvider subclass.
 */
async function getDiscoveryProvider(
  datastoreServices: Array<IDatastoreService<any>>,
): Promise<BaseDiscoveryProvider> {
  if (!DISCOVERY_PROVIDER) {
    throw new Error('DISCOVERY_PROVIDER not specified in configuration.');
  }

  logger.info(`using discovery provider: ${DISCOVERY_PROVIDER}`);

  const ProviderClass = await loadClass<
    new (options: any) => BaseDiscoveryProvider
  >(`@/services/discovery/providers/${DISCOVERY_PROVIDER}`);

  const discoveryMap = datastoreServices.reduce((prev, curr) => {
    const datastoreType = curr.getDatastoreType();
    prev[datastoreType] = {
      matcher: curr.discoveryCallback,
      ungroupClusters: curr.ungroupClustersCallback,
    };
    return prev;
  }, {} as IDiscoveryMap);

  return new ProviderClass({ discoveryMap });
}

/**
 * Setup listeners for when clusters/environments/regions are loaded/updated.
 */
export async function setupDiscoveryService(
  explorerCache: ExplorerCache,
  datastoreServices: Array<IDatastoreService<any>>,
  store: IStore,
): Promise<DiscoveryService> {
  const provider = await getDiscoveryProvider(datastoreServices);
  const discoveryService = new DiscoveryService(provider);

  const { discovery } = store;

  discoveryService.on('loaded-clusters', (clusters: IClusterDefinition[]) => {
    logger.info('clusters loaded');

    const clustersByTag = getGroupedClusters(clusters, 'datastoreType');

    forEach(clustersByTag, (datastoreClusters, datastoreType) => {
      logger.info(
        `loaded ${datastoreClusters.length} ${datastoreType} clusters`,
      );
      const type = DatastoreType[datastoreType.toUpperCase()];
      explorerCache.updateClusters(type, datastoreClusters);
    });

    discovery.clusters = clustersByTag;
    discovery.status = State.SUCCESS;

    logger.info(`loaded ${clusters.length} total clusters`);
  });

  discoveryService.on('loaded-environments', (environments) => {
    logger.info(`loaded environments: ${environments}`);
    discovery.environments = environments;
  });

  discoveryService.on('loaded-regions', (regions) => {
    logger.info(`loaded regions: ${regions}`);
    discovery.regions = regions;
  });

  discoveryService.on('error', (err) => {
    logger.error(`failed to load discovery info: ${err.message}`);
    discovery.status = State.ERROR;
  });

  discovery.status = State.LOADING;
  return discoveryService;
}

function getGroupedClusters(
  clusters: IClusterDefinition[],
  groupByProp: keyof IClusterDefinition,
) {
  return chain(clusters)
    .groupBy(groupByProp)
    .pick(SUPPORTED_DATASTORE_TYPES)
    .value();
}
