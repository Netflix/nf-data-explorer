import { State } from '@/typings/enums';
import { IStore } from '@/typings/store';
import {
  IClusterAClMap,
  IClusterDefinition,
  IClusterOwnership,
  DatastoreType,
} from '@/typings/typings';

const baseCluster: IClusterDefinition = {
  env: 'test',
  instances: [],
  name: 'TBD',
  region: 'us-east-1',
  datastoreType: 'cassandra',
};

export function createTestCluster(
  datastoreType: DatastoreType,
  clusterName: string,
  env = 'test',
  region = 'us-east-1',
): IClusterDefinition {
  return {
    ...baseCluster,
    name: clusterName,
    datastoreType: datastoreType,
    env,
    region,
  };
}

export function createClusterOwnership(
  clusterName: string,
  owners: string[],
  isShared = false,
): IClusterOwnership {
  return {
    isShared,
    name: clusterName,
    owners,
  };
}

export interface IMockStoreCluster {
  ownership: IClusterOwnership;
  cluster: IClusterDefinition;
}

export function createStoreItem(
  datastoreType: DatastoreType,
  clusterName: string,
  owners: string[],
  isShared = false,
  env = 'test',
  region = 'us-east-1',
): IMockStoreCluster {
  return {
    cluster: {
      env,
      instances: [],
      name: clusterName,
      region,
      datastoreType,
    },
    ownership: {
      isShared,
      name: clusterName,
      owners,
    },
  };
}

/**
 * Helper method for creating a mock store populated with a list of clusters.
 * Use createStoreItem() to create the items in the store.
 * @see createStoreItem
 */
export function createMockStore(storeItems: IMockStoreCluster[]): IStore {
  const clusterAclMap = {} as IClusterAClMap;
  const clusters = {};

  storeItems.forEach(
    ({ cluster: clusterDefinition, ownership: clusterOwnership }) => {
      const { name, datastoreType } = clusterDefinition;
      clusterAclMap[name] = clusterOwnership;
      clusters[datastoreType] =
        clusters[datastoreType] || new Array<IClusterDefinition>();
      clusters[datastoreType].push(clusterDefinition);
    },
  );

  return {
    accessControl: {
      clusterAclMap,
      status: State.SUCCESS,
    },
    discovery: {
      clusters,
      environments: ['test'],
      regions: ['us-east-1'],
      status: State.SUCCESS,
    },
  } as IStore;
}
