import { getApp } from '@/index';
import { userHeaders } from '@/utils/__tests__/helpers/auth-helper';
import { Application } from 'express';
import request from 'supertest';

describe('static files', () => {
  let app: Application;
  const titleTag = '<title>Netflix | Data Explorer</title>';

  beforeAll(async () => {
    app = await getApp();
  });

  it('expected to serve static file', async () => {
    const result = await request(app).get('/').set(userHeaders);
    expect(result.status).toEqual(200);
    expect(result.text).toContain(titleTag);
  });

  it('all unknown routes should serve index.html to enable client routing', async () => {
    const result = await request(app)
      .get('/cassandra/clusters/CASS_TEST_CLUSTER/explore')
      .set(userHeaders);
    expect(result.status).toEqual(200);
    expect(result.text).toContain(titleTag);
  });
});

describe('/healthcheck route', () => {
  let app: Application;

  beforeAll(async () => {
    app = await getApp();
  });

  it('healthcheck without credentials should return OK', async () => {
    const result = await request(app).get('/healthcheck');
    expect(result.text).toEqual('OK!');
    expect(result.status).toEqual(200);
  });
});
