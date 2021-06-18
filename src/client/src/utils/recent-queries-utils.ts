import { capitalize } from 'lodash';

const MAX_QUERIES = 50;

type DatastoreType = 'cassandra';

export interface IRecentQuery {
  query: string;
  timestamp: number;
}

interface IQueryStore {
  [clusterName: string]: IRecentQuery[];
}

/**
 * Provides a simple abstraction for storing recent queries in Local Storage.
 * Users are expected to call save() after all updates.
 */
class QueryStore {
  private queryStore: IQueryStore;

  constructor(readonly datastore: DatastoreType) {
    const queryStoreString =
      window.localStorage.getItem(this.getKey(this.datastore)) || '{}';
    this.queryStore = JSON.parse(queryStoreString);
  }

  public save() {
    window.localStorage.setItem(
      this.getKey(this.datastore),
      JSON.stringify(this.queryStore),
    );
    return this;
  }

  public getRecentQueries(cluster: string): IRecentQuery[] {
    if (!this.queryStore) {
      return [];
    }
    return this.queryStore[cluster] || [];
  }

  public setRecentQueries(cluster: string, recentQueries: IRecentQuery[]) {
    this.queryStore[cluster] = recentQueries;
    return this;
  }

  private getKey(datastore: DatastoreType) {
    return `recent${capitalize(datastore)}Queries`;
  }
}

export function addRecentQuery(
  datastore: DatastoreType,
  cluster: string,
  query: string,
): void {
  if (!query) {
    return;
  }

  const queryStore = new QueryStore(datastore);
  const recentQueries = queryStore.getRecentQueries(cluster);

  // de-dupe existing events
  const existingQuery = recentQueries.find((item) => item.query === query);
  if (existingQuery) {
    existingQuery.timestamp = Date.now();
  } else {
    if (recentQueries.length > MAX_QUERIES - 1) {
      recentQueries.splice(0, 1); // remove the first (oldest item)
    }
    recentQueries.push({ query, timestamp: Date.now() });
  }
  queryStore.setRecentQueries(cluster, recentQueries).save();
}

export function getRecentQueries(
  datastore: DatastoreType,
  cluster: string,
): IRecentQuery[] {
  if (!cluster) {
    return [];
  }
  return new QueryStore(datastore).getRecentQueries(cluster);
}

export function removeAllRecentQueries(
  datastore: DatastoreType,
  cluster: string,
): void {
  if (!cluster) {
    return;
  }
  new QueryStore(datastore).setRecentQueries(cluster, []).save();
}

export function removeRecentQuery(
  datastore: DatastoreType,
  cluster: string,
  query: string,
): void {
  const queryStore = new QueryStore(datastore);
  const queries = queryStore.getRecentQueries(cluster);
  const index = queries.findIndex((item) => item.query === query);
  if (index >= 0) {
    queries.splice(index, 1);
  }
  queryStore.setRecentQueries(cluster, queries);
  queryStore.save();
}
