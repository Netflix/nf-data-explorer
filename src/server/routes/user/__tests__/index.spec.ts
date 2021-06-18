import { getApp } from '@/index';
import { userHeaders } from '@/utils/__tests__/helpers/auth-helper';
import { Application } from 'express';
import request from 'supertest';

describe('/user route', () => {
  let app: Application;

  beforeAll(async () => {
    const MockConfiguration = (await import('@/config/configuration')) as any;
    MockConfiguration.__updateConfig({
      REQUIRE_AUTHENTICATION: true,
    });

    app = await getApp();
  });

  it('should verify the user', async () => {
    const result = await request(app).get('/REST/user').set(userHeaders);
    expect(result.status).toEqual(200);
    const userInfo = JSON.parse(result.text);
    expect(userInfo.googleGroups).toEqual(['all@netflix.com']);
    expect(userInfo.isAdmin).toEqual(false);
  });
});
