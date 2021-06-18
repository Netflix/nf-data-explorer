export enum EntityType {
  KEYSPACE,
}

export enum DatastoreType {
  CASSANDRA = 'cassandra',
  DYNOMITE = 'dynomite',
}

export enum State {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
