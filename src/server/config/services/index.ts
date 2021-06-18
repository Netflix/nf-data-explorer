import { getConfig } from '@/config/configuration';
import loggerFactory from '@/config/logger';
import { getStore } from '@/model/store';
import ClusterAccessControlService from '@/services/cluster-acls/ClusterAccessControlService';
import { DiscoveryService } from '@/services/discovery';
import EntityAccessControlCache from '@/services/entity-acls/EntityAccessControlCache';
import EntityAccessControlService from '@/services/entity-acls/EntityAccessControlService';
import ExplorerCache from '@/services/explorer/ExplorerCache';
import UserGroupCache from '@/services/user/UserGroupCache';
import { Application } from 'express';
import { setupClusterAccessControlService } from './cluster-acl';
import { setupDatastoreSupport } from './datastores';
import { setupDiscoveryService } from './discovery';
import {
  setupEntityAccessControlCache,
  setupEntityAccessControlService,
} from './entity-acls';
import { setupExplorerCache } from './explorer';
import { setupUserGroupCache } from './user';

const logger = loggerFactory(module);

const { SUPPORTED_DATASTORE_TYPES } = getConfig();

let entityAccessControlCache: EntityAccessControlCache;
let explorerCache: ExplorerCache;
let discoveryService: DiscoveryService;
let clusterAccessControlService: ClusterAccessControlService;
let userGroupCache: UserGroupCache;
let entityAccessControlService: EntityAccessControlService;

export async function setupServices(app: Application): Promise<void> {
  const store = getStore();
  try {
    // load configured datastores
    const datastoreServices = await setupDatastoreSupport(
      SUPPORTED_DATASTORE_TYPES,
    );

    // setup caches
    entityAccessControlCache = await setupEntityAccessControlCache(app);
    explorerCache = await setupExplorerCache();
    userGroupCache = await setupUserGroupCache();

    // setup async services
    clusterAccessControlService = await setupClusterAccessControlService(
      app,
      store,
    );
    discoveryService = await setupDiscoveryService(
      explorerCache,
      datastoreServices,
      store,
    );
    entityAccessControlService = await setupEntityAccessControlService();

    // start async services
    await Promise.all([
      discoveryService.start(),
      clusterAccessControlService.start(),
    ]);
  } catch (err) {
    logger.error('failed to setup services');
    throw err;
  }
}

export function getEntityAccessControlService(): EntityAccessControlService {
  return entityAccessControlService;
}

export function getEntityAccessControlCache(): EntityAccessControlCache {
  return entityAccessControlCache;
}

export function getUserGroupCache(): UserGroupCache {
  return userGroupCache;
}

export function getExplorerCache(): ExplorerCache {
  return explorerCache;
}

export function getClusterAccessControlService(): ClusterAccessControlService {
  return clusterAccessControlService;
}
