export default interface IUserCacheProvider {
  getUserGroups(email: string, accessToken: string): Promise<string[]>;
}
