import IUserCacheProvider from '@/services/user/providers/IUserCacheProvider';
import UserGroupCache from '@/services/user/UserGroupCache';
import { loadClass } from '@/utils/class-loader-utils';
import { getConfig } from '../configuration';

const { USER_CACHE_PROVIDER } = getConfig();

async function getUserGroupCacheProvider() {
  if (!USER_CACHE_PROVIDER) {
    throw new Error('USER_CACHE_PROVIDER not specified in configuration.');
  }
  const UserCacheClass = await loadClass<new () => IUserCacheProvider>(
    `@/services/user/providers/${USER_CACHE_PROVIDER}`,
  );
  return new UserCacheClass();
}

export async function setupUserGroupCache(): Promise<UserGroupCache> {
  return new UserGroupCache(await getUserGroupCacheProvider());
}
