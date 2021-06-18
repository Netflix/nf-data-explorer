import { getConfig } from '@/config/configuration';
import setupLogger from '@/config/logger';
import LRU from 'lru-cache';
import IUserCacheProvider from './providers/IUserCacheProvider';

const { USER_CACHE_TIMEOUT } = getConfig();

const logger = setupLogger(module);

interface ICacheItem {
  email: string;
  groups: string[];
}

/**
 * Provides a cache-first strategy for reading user google group information.
 */
export default class UserGroupCache {
  private userGroupCache: LRU<string, ICacheItem>;

  constructor(readonly provider: IUserCacheProvider) {
    if (!provider) {
      throw new Error('UserCacheProvider not specified');
    }
    this.userGroupCache = new LRU({
      max: 50,
      maxAge: USER_CACHE_TIMEOUT,
      dispose: (key, _n) => {
        logger.debug(`User Cache: dropping key "${key}"`);
      },
    });
  }

  /**
   * Fetches the user groups with a cache-first strategy.
   * @param email The user's email.
   * @param accessToken The user's access token (necessary to hit the service).
   */
  public async getUserGroups(
    email: string,
    accessToken: string,
  ): Promise<string[]> {
    const cacheEntry = this.userGroupCache.get(email);
    if (cacheEntry) {
      return cacheEntry.groups;
    }

    try {
      const groups = await this.provider.getUserGroups(email, accessToken);
      if (groups.length === 0) {
        logger.warn(`No groups returned for user ${email}`);
      }

      this.userGroupCache.set(email, {
        email,
        groups,
      });
      return groups;
    } catch (err) {
      logger.error(
        `Failed to lookup user groups for user ${email}. Error: ${err.message}`,
      );
      return [];
    }
  }

  public values(): ICacheItem[] {
    return this.userGroupCache.values();
  }
}
