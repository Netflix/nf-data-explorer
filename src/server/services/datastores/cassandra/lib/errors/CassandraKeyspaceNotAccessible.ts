import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraKeyspaceNotAccessible extends HttpStatusError {
  constructor(readonly keyspace: string) {
    super(
      403,
      'Keyspace is not accessible',
      `Operation on keyspace "${keyspace}" is not permitted.`,
      `You are not authorized to access the keyspace "${keyspace}" on this cluster.`,
    );
  }
}
