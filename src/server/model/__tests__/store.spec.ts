import { IStore } from '@/typings/store';
import {
  createMockStore,
  createStoreItem,
} from '../__mocks__/mock-store-helpers';

describe('store suite', () => {
  const clusterName = 'clusterA';
  const findCluster = (theStore: IStore, theName: string) =>
    theStore.discovery.clusters.cassandra.find(
      (cluster) => cluster.name === theName,
    );

  it('should allow replacing the store with mock data', async () => {
    const MockStoreModule = (await import('@/model/store')) as any;
    const origStore = MockStoreModule.getStore();

    // verify store doesn't have an existing cluster with the same name
    expect(
      findCluster(MockStoreModule.getStore(), clusterName),
    ).toBeUndefined();

    // mock a new store with our new cluster (this is an example
    // of how to mock store data in other tests).
    const store = createMockStore([
      createStoreItem(
        'cassandra',
        clusterName,
        ['owner1@netflix.com', 'owner2@netflix.com'],
        false,
      ),
    ]);

    MockStoreModule.getStore.mockReturnValue(store);
    expect(findCluster(MockStoreModule.getStore(), clusterName)).toBeDefined();

    // resetting the mock should not affect the original store
    MockStoreModule.getStore.mockReset();
    expect(findCluster(origStore, clusterName)).toBeUndefined();
  });
});
