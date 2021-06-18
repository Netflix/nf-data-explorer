import { IUserInfo } from '@/typings/userinfo';
import { IUserServiceProvider } from './IUserServiceProvider';

export default class BaseUserServiceProvider implements IUserServiceProvider {
  public async fetchUserInfo(): Promise<IUserInfo> {
    return {
      access_token: '',
      access_token_expires: '',
      refresh_token: '',
      userinfo: {
        email: 'jdoe@acme.com',
        familyName: '',
        fullName: '',
        givenName: '',
        googleGroups: [],
        preferred_username: 'jdoe',
        sub: '',
        userId: '',
      },
    };
  }
}
