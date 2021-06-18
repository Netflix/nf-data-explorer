import { getApp } from '@/index';
import {
  createMockStore,
  createStoreItem,
} from '@/model/__mocks__/mock-store-helpers';
import { IClusterRegionSummary, IClusterSummary } from '@/typings/typings';
import { userHeaders } from '@/utils/__tests__/helpers/auth-helper';
import { Application } from 'express';
import request from 'supertest';

jest.mock('@/model/store');

describe('/datastores route suite', () => {
  let app: Application;

  const teamClusterName = 'datastore-route-test-cluster';
  const teamDL = 'cass-test-cluster-owners@netflix.com';
  let setUserGroups: (groups?: string[]) => void;

  const opsTeamDL = 'ops-team@acme.com';
  const restrictedClusterNames = ['restricted-a', 'restricted-b'];
  const unrestrictedClusterNames = ['unrestricted-a'];

  beforeAll(async () => {
    // setup to manipulate user groups before each test
    const MockServices = await import('@/config/services');
    setUserGroups = (MockServices as any).__setUserGroups;

    // apply test config
    const MockConfiguration = (await import('@/config/configuration')) as any;
    MockConfiguration.__updateConfig({
      ALL_CLUSTERS_MEMBERS: [opsTeamDL],
      REQUIRE_AUTHENTICATION: true,
    });

    // create a mock store with sample datastores
    const MockStoreModule = (await import('@/model/store')) as any;
    const store = createMockStore([
      ...restrictedClusterNames.map((name) =>
        createStoreItem('cassandra', name, [], true),
      ),
      ...unrestrictedClusterNames.map((name) =>
        createStoreItem('cassandra', name, [], false),
      ),
      createStoreItem('cassandra', teamClusterName, [teamDL], false),
    ]);
    MockStoreModule.getStore.mockReturnValue(store);
  });

  beforeEach(async () => {
    app = await getApp();
    setUserGroups(); // reset the user groups mock to default values
  });

  it('should return the list of clusters owned by a user', async () => {
    setUserGroups([teamDL]);
    const result = await request(app).get('/REST/datastores').set(userHeaders);
    expect(result.status).toEqual(200);
    const clusters = JSON.parse(result.text) as IClusterRegionSummary[];
    expect(
      clusters.find((cluster) => cluster.name === teamClusterName),
    ).toBeDefined();
  });

  it('should only return shared and unrestricted clusters for a user without any dedicated clusters', async () => {
    const result = await request(app).get('/REST/datastores').set(userHeaders);
    expect(result.status).toEqual(200);
    const clusters = JSON.parse(result.text) as IClusterRegionSummary[];
    const unrestrictedClusterSet = new Set(unrestrictedClusterNames);
    expect(
      clusters.find((cluster) => cluster.name === teamClusterName),
    ).toBeUndefined();
    expect(
      clusters.every(
        (cluster) =>
          cluster.isShared || unrestrictedClusterSet.has(cluster.name),
      ),
    ).toBe(true);
  });

  it('should return the list of clusters for a member of the all clusters group', async () => {
    setUserGroups([opsTeamDL]);
    const result = await request(app).get('/REST/datastores').set(userHeaders);
    expect(result.status).toEqual(200);
    const clusters = JSON.parse(result.text) as IClusterSummary[];

    const returnedClusterNames = new Set(
      clusters.map((cluster) => cluster.name),
    );
    // no restricted clusters should be returned
    expect(
      restrictedClusterNames.every(
        (restrictedName) => !returnedClusterNames.has(restrictedName),
      ),
    );

    // all unrestricted clusters should be returned
    expect(
      unrestrictedClusterNames.every((unrestrictedName) =>
        returnedClusterNames.has(unrestrictedName),
      ),
    );

    // test team cluster should be included
    expect(returnedClusterNames.has(teamClusterName)).toBe(true);
  });
});
