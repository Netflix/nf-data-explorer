import { IUserInfo } from '@/typings/userinfo';
import { loadServiceClass } from '@/utils/class-loader';
import { IUserServiceProvider } from './providers/IUserServiceProvider';

let provider: IUserServiceProvider;

export async function fetchUserInfo(): Promise<IUserInfo> {
  const ProviderClass = await loadServiceClass<IUserServiceProvider>(
    'user/providers',
    'UserServiceProvider',
  );
  provider = new ProviderClass();
  return provider.fetchUserInfo();
}
