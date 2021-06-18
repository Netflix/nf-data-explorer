import { getApp } from '@/index';
import { userHeaders } from '@/utils/__tests__/helpers/auth-helper';
import { Application } from 'express';
import request from 'supertest';

describe('middleware test suite', () => {
  let app: Application;

  beforeAll(async () => {
    app = await getApp();
  });

  it('Should have CORS enabled', async () => {
    const result = await request(app)
      .get('/REST/datastores/cassandra/clusters')
      .set(userHeaders);
    expect(result.header['access-control-allow-origin']).toEqual('*');
  });
});
