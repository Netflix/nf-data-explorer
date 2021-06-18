import { IStore } from '@/typings/store';

/**
 * Contains app state that needs to be accessible from various parts of the app.
 * Should only contain transient data as this data is only stored in memory.
 * Good candidates are temporary caches of information from other services.
 */

const store: IStore = {
  accessControl: {
    clusterAclMap: undefined,
    status: undefined,
  },
  discovery: {
    clusters: {},
    environments: [],
    regions: [],
    status: undefined,
  },
};

export function getStore(): IStore {
  return store;
}
