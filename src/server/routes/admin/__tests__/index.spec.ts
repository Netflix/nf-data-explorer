import { getApp } from '@/index';
import { userHeaders } from '@/utils/__tests__/helpers/auth-helper';
import { Application } from 'express';
import request from 'supertest';

describe('/admin route', () => {
  let app: Application;

  beforeAll(async () => {
    app = await getApp();
  });

  it('non-admin users should be rejected', async () => {
    const result = await request(app).get('/REST/admin').set(userHeaders);
    expect(result.status).toEqual(401);
  });
});
