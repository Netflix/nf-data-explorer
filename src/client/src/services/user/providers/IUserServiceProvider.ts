import { IUserInfo } from '@/typings/userinfo';

export interface IUserServiceProvider {
  fetchUserInfo(): Promise<IUserInfo>;
}
