import { getConfig } from '@/config/configuration';
import { getApp } from '@/index';
import {
  createMockStore,
  createStoreItem,
} from '@/model/__mocks__/mock-store-helpers';
import { IRegionInfo } from '@/typings/typings';
import { userHeaders } from '@/utils/__tests__/helpers/auth-helper';
import { getAppStack } from '@/utils/app-utils';
import { Application } from 'express';
import request from 'supertest';

const { ENVIRONMENTS, REGIONS } = getConfig();

describe('/env route', () => {
  let app: Application;

  const clusterName = 'env-route-test-cluster';
  const sampleDatastore = 'cassandra';
  const availability = [
    { env: 'test', region: 'us-east-1' },
    { env: 'test', region: 'eu-west-1' },
    { env: 'prod', region: 'eu-west-1' },
  ] as IRegionInfo[];

  beforeAll(async () => {
    app = await getApp();
    const MockStoreModule = await import('@/model/store');
    const mockStore = createMockStore(
      availability.map((regionInfo) =>
        createStoreItem(
          'cassandra',
          clusterName,
          ['owner1@netflix.com', 'owner2@netflix.com'],
          false,
          regionInfo.env,
          regionInfo.region,
        ),
      ),
    );
    (MockStoreModule.getStore as any).mockReturnValue(mockStore);
  });

  describe('read only operations', () => {
    it('should fetch the environments for the given cluster', async () => {
      const result = await request(app)
        .get(`/REST/env/regions/cassandra/${clusterName}`)
        .set(userHeaders);

      expect(result.status).toEqual(200);
      const data = JSON.parse(result.text) as IRegionInfo[];
      const comparator = (a: IRegionInfo, b: IRegionInfo) =>
        `${a.env}-${a.region}`.localeCompare(`${b.env}-${b.region}`);
      expect(data.sort(comparator)).toEqual(availability.sort(comparator));
    });

    it('should return empty for an unknown cluster', async () => {
      const result = await request(app)
        .get(`/REST/env/regions/${sampleDatastore}/unknownClusterName`)
        .set(userHeaders);
      expect(result.status).toEqual(200);
      expect(JSON.parse(result.text)).toEqual([]);
    });

    it('should return all available regions', async () => {
      const result = await request(app)
        .get('/REST/env/regions')
        .set(userHeaders);
      expect(result.status).toEqual(200);

      const data = JSON.parse(result.text) as {
        available: IRegionInfo[];
      };
      const regionIds = new Array<string>();
      ENVIRONMENTS.forEach((envName) => {
        REGIONS.forEach((regionName) =>
          regionIds.push(`${envName}:${regionName}`),
        );
      });

      expect(
        data.available.map((item) => `${item.env}:${item.region}`).sort(),
      ).toEqual(regionIds.sort());
    });
  });

  describe('redirect suite', () => {
    it('should return a 400 for an invalid env', async () => {
      const region = 'us-east-1';
      const result = await request(app)
        .post(`/REST/env/regions/invalidenv-${region}`)
        .set(userHeaders)
        .send({
          datastoreType: sampleDatastore,
          cluster: clusterName,
        });
      expect(result.status).toEqual(400);
    });

    it('should return a 404 for an invalid region', async () => {
      const result = await request(app)
        .post(`/REST/env/regions/${ENVIRONMENTS[0]}-invalidregion`)
        .set(userHeaders)
        .send({
          datastoreType: sampleDatastore,
          cluster: clusterName,
        });
      expect(result.status).toEqual(404);
    });

    it('should redirect to the appropriate cluster', async () => {
      const envName = 'local';
      const region = 'local';
      const result = await request(app)
        .post(`/REST/env/regions/${envName}-${region}`)
        .set(userHeaders)
        .send({ datastoreType: sampleDatastore, cluster: clusterName });
      expect(result.status).toEqual(200);
      expect(result.header.location).toEqual(
        `https://${getAppStack(
          app,
        )}-${region}.${envName}.acme.net/${sampleDatastore}/clusters/${clusterName}`,
      );
    });
  });
});
