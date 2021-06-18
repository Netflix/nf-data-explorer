import {
  createMockStore,
  createStoreItem,
  IMockStoreCluster,
} from '@/model/__mocks__/mock-store-helpers';
import ClusterNotAuthorizedError from '@/model/errors/ClusterNotAuthorizedError';
import {
  canUserAccessCluster,
  verifyUserCanAccessCluster,
} from '@/utils/acl-utils';
import { createTestUser } from './helpers/user-helper';

jest.mock('@/model/store');
jest.mock('@/config/configuration');

describe('Cluster Access Control', () => {
  const RESTRICTED_CLUSTERS = ['restricted-a', 'restricted-b'];
  const UNRESTRICTED_CLUSTERS = ['unrestricted-a', 'unrestricted-b'];

  const netflixDL = 'all@netflix.com';
  const opsTeam = 'ops-team@netflix.com';
  const teamDL = 'teamA@netflix.com';

  // create a couple of sample users
  const opsUser = createTestUser('ops-user@netflix.com', [opsTeam, netflixDL]);
  const generalUser = createTestUser('jack@netflix.com', [netflixDL]);
  const teamUser = createTestUser('jill@netflix.com', [teamDL, netflixDL]);

  beforeAll(async () => {
    const MockConfiguration = (await import('@/config/configuration')) as any;
    MockConfiguration.__updateConfig({
      ALL_CLUSTERS_MEMBERS: [opsTeam],
      REQUIRE_AUTHENTICATION: true,
      RESTRICTED_CLUSTERS,
      UNRESTRICTED_CLUSTERS,
    });
  });

  describe('Cluster Access', () => {
    let sharedClusterItem: IMockStoreCluster;
    let privateCluster: IMockStoreCluster;
    let unrestrictedClusters: IMockStoreCluster[];
    let restrictedClusters: IMockStoreCluster[];

    beforeAll(async () => {
      const MockStoreModule = (await import('@/model/store')) as any;

      unrestrictedClusters = UNRESTRICTED_CLUSTERS.map((name) =>
        createStoreItem('cassandra', name, [], true),
      );
      restrictedClusters = RESTRICTED_CLUSTERS.map((name) =>
        createStoreItem('cassandra', name, [], true),
      );

      sharedClusterItem = createStoreItem(
        'cassandra',
        'acl_test_cluster_1',
        [],
        true,
      );
      privateCluster = createStoreItem(
        'cassandra',
        'acl_test_cluster_2',
        [teamDL],
        false,
      );

      const mockStoreData = createMockStore([
        sharedClusterItem,
        privateCluster,
        ...unrestrictedClusters,
        ...restrictedClusters,
      ]);
      MockStoreModule.getStore.mockReturnValue(mockStoreData);
    });

    describe('Shared Clusters', () => {
      it('Should allow general access to shared cluster', () =>
        expect(
          canUserAccessCluster(generalUser, sharedClusterItem.cluster),
        ).toBe(true));

      it('Should allow Ops team access to shared cluster', () =>
        expect(canUserAccessCluster(opsUser, sharedClusterItem.cluster)).toBe(
          true,
        ));

      it('Verifying cluster acccess should throw for unauthorized users', () =>
        expect(() =>
          verifyUserCanAccessCluster(generalUser, privateCluster.cluster),
        ).toThrow(ClusterNotAuthorizedError));

      it('Should not throw for Ops team members', () => {
        expect(() =>
          verifyUserCanAccessCluster(opsUser, privateCluster.cluster),
        ).not.toThrow(ClusterNotAuthorizedError);
      });

      it('Should allow general access to unrestricted clusters', () => {
        unrestrictedClusters.forEach((cluster) => {
          expect(canUserAccessCluster(generalUser, cluster.cluster)).toBe(true);
        });
      });

      it('Should not allow any access (even Ops team) to restricted clusters', () => {
        restrictedClusters.forEach((cluster) => {
          expect(canUserAccessCluster(opsUser, cluster.cluster)).toBe(false);
        });
      });
    });

    describe('Dedicated Clusters', () => {
      it('Should not allow general access to dedicated cluster', () => {
        expect(canUserAccessCluster(generalUser, privateCluster.cluster)).toBe(
          false,
        );
      });

      it('Should allow team owner access to dedicated cluster', () => {
        expect(canUserAccessCluster(teamUser, privateCluster.cluster)).toBe(
          true,
        );
      });

      it('Should allow Ops team access to dedicated cluster', () => {
        expect(canUserAccessCluster(opsUser, privateCluster.cluster)).toBe(
          true,
        );
      });

      it('Should not throw for Ops team access to dedicated cluster', () => {
        expect(() =>
          verifyUserCanAccessCluster(opsUser, privateCluster.cluster),
        ).not.toThrow(ClusterNotAuthorizedError);
      });
    });
  });
});
