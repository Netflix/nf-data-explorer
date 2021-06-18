import IUserCacheProvider from './IUserCacheProvider';

export default class DefaultUserCacheProvider implements IUserCacheProvider {
  public async getUserGroups(
    _email: string,
    _accessToken: string,
  ): Promise<string[]> {
    return [];
  }
}
