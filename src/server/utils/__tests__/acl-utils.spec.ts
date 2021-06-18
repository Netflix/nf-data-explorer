import { privateCluster, sharedCluster } from '@/model/__mocks__/store';
import EntityNotAuthorizedError from '@/model/errors/EntityNotAuthorizedError';
import { EntityType } from '@/typings/enums';
import { IRequestUserInfo } from '@/typings/express';
import {
  filterAccessibleEntities,
  verifyUserAccessEntity,
} from '@/utils/acl-utils';
import { createTestKeyspace } from './helpers/entity-helper';
import { createTestUser } from './helpers/user-helper';

jest.mock('@/model/store');
jest.mock('@/config/services', () => {
  const MockCache = (jest.genMockFromModule(
    '../../services/entity-acls/EntityAccessControlCache', // must be absolute path
  ) as any).default;
  return {
    getEntityAccessControlCache: () => new MockCache(undefined),
  };
});

describe('Entity Access Control', () => {
  const netflixDL = 'all@netflix.com';
  const teamDL = 'teamA@netflix.com';

  const teamKeyspaceName = 'team_keyspace';
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const teamKeyspace = createTestKeyspace(
    sharedCluster.cluster.name,
    sharedCluster.cluster.env,
    teamKeyspaceName,
    [teamDL],
  );

  const generalKeyspaceName = 'general_keyspace';
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const generalKeyspace = createTestKeyspace(
    sharedCluster.cluster.name,
    sharedCluster.cluster.env,
    generalKeyspaceName,
    [netflixDL],
  );

  const teamUser: IRequestUserInfo = createTestUser('jill@netflix.com', [
    teamDL,
    netflixDL,
  ]);

  describe('Filtering Accessible Entities', () => {
    it('Should not filter entities on dedicated cluster', () => {
      expect.assertions(1);
      const keyspaceNames = [teamKeyspaceName, 'other_keyspace_name'];
      return expect(
        filterAccessibleEntities(
          teamUser,
          privateCluster.cluster,
          EntityType.KEYSPACE,
          keyspaceNames,
        ),
      ).resolves.toEqual(new Set(keyspaceNames));
    });
  });

  describe('Verify User Access', () => {
    const opsTeam = 'ops-team@netflix.com';
    const generalUser: IRequestUserInfo = createTestUser('jack@netflix.com', [
      netflixDL,
    ]);
    const opsUser: IRequestUserInfo = createTestUser('ops-user@netflix.com', [
      opsTeam,
      netflixDL,
    ]);

    beforeAll(async () => {
      const MockConfiguration = (await import('@/config/configuration')) as any;
      MockConfiguration.__updateConfig({
        ALL_ENTITY_MEMBERS: [opsTeam],
      });
    });

    it('Should allow team member access to entity on shared cluster', async () => {
      expect.assertions(1);
      try {
        await verifyUserAccessEntity(
          teamUser,
          sharedCluster.cluster,
          EntityType.KEYSPACE,
          teamKeyspaceName,
          false,
        );
      } catch (err) {
        expect(err).toBeInstanceOf(EntityNotAuthorizedError);
      }
    });

    it('Should not allow general access to entity on shared cluster', async () => {
      expect.assertions(1);
      try {
        await verifyUserAccessEntity(
          generalUser,
          sharedCluster.cluster,
          EntityType.KEYSPACE,
          teamKeyspaceName,
          false,
        );
      } catch (err) {
        expect(err).toBeInstanceOf(EntityNotAuthorizedError);
      }
    });

    it('Should allow Ops team access to entity on shared cluster', async () => {
      expect.assertions(1);
      try {
        const result = await verifyUserAccessEntity(
          opsUser,
          sharedCluster.cluster,
          EntityType.KEYSPACE,
          teamKeyspaceName,
          false,
        );
        expect(result).toBeUndefined();
      } catch (err) {
        // no-op
      }
    });

    it('Should allow Ops team access to entity without owners', async () => {
      expect.assertions(1);
      try {
        const result = await verifyUserAccessEntity(
          opsUser,
          sharedCluster.cluster,
          EntityType.KEYSPACE,
          'keyspace_without_owners',
          false,
        );
        expect(result).toBeUndefined();
      } catch (err) {
        // no-op
      }
    });

    it('Should not allow general access to entity without owners', async () => {
      expect.assertions(1);
      try {
        await verifyUserAccessEntity(
          generalUser,
          sharedCluster.cluster,
          EntityType.KEYSPACE,
          'keyspace_without_owners',
          false,
        );
      } catch (err) {
        expect(err).toBeInstanceOf(EntityNotAuthorizedError);
      }
    });

    it('Should not allow general access to team keyspace', async () => {
      expect.assertions(1);
      try {
        await verifyUserAccessEntity(
          generalUser,
          sharedCluster.cluster,
          EntityType.KEYSPACE,
          teamKeyspaceName,
          false,
        );
      } catch (err) {
        expect(err).toBeInstanceOf(EntityNotAuthorizedError);
      }
    });
  });
});
