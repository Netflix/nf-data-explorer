import ExplorerCache from '@/services/explorer/ExplorerCache';
jest.mock('@/services/explorer/ExplorerCache');

export const setupServices = jest
  .fn()
  .mockResolvedValue((): Promise<void> => Promise.resolve());

const DEFAULT_USER_GROUPS = ['all@netflix.com'];
const __getUserGroups = jest.fn();
__getUserGroups.mockResolvedValue(DEFAULT_USER_GROUPS);

/**
 * Call this function in tests in a beforeAll()/beforeEach() to change the
 * user's groups for a request. You can then call it again in
 * afterAll()/afterEach() to reset the values to the default.
 */
export function __setUserGroups(userGroups = DEFAULT_USER_GROUPS): void {
  __getUserGroups.mockResolvedValue(userGroups);
}

export const getUserGroupCache = jest.fn().mockImplementation(() => {
  return {
    getUserGroups: () => {
      return __getUserGroups();
    },
  };
});

const explorerCache = new ExplorerCache();
export const getExplorerCache = (): ExplorerCache => {
  return explorerCache;
};
