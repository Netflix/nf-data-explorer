import { getConfig } from '@/config/configuration';
import { createMockStore, createStoreItem } from './mock-store-helpers';

const { RESTRICTED_CLUSTERS, UNRESTRICTED_CLUSTERS } = getConfig();

const sharedClusterName = 'shared_cluster_name';

const privateClusterName = 'private_cluster_name';
const privateClusterOwners = ['teamA@netflix.com'];

export const sharedCluster = createStoreItem(
  'cassandra',
  sharedClusterName,
  [],
  true,
);
export const privateCluster = createStoreItem(
  'cassandra',
  privateClusterName,
  privateClusterOwners,
  false,
);

const store = createMockStore([
  ...RESTRICTED_CLUSTERS.map((clusterName) =>
    createStoreItem('cassandra', clusterName, [], false),
  ),
  ...UNRESTRICTED_CLUSTERS.map((clusterName) =>
    createStoreItem('cassandra', clusterName, [], false),
  ),
  sharedCluster,
  privateCluster,
]);

export const getStore = jest.fn().mockImplementation(() => {
  // clone the store to avoid any cross-test funny business
  return JSON.parse(JSON.stringify(store));
});
