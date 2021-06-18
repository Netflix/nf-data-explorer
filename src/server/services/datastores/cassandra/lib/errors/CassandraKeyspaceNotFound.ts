import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraKeyspaceNotFound extends HttpStatusError {
  constructor(keyspace: string) {
    super(
      404,
      'Keyspace Not Found',
      `The keyspace "${keyspace}" could not be found.`,
      'Please check the keyspace name. Note, some drivers permit creation of case-sensitive keyspace ' +
        'and table names. Please ensure you have the exact case-sensitive spelling.',
    );
  }
}
