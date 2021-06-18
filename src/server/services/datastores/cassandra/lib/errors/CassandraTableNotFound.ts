import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraTableNotFound extends HttpStatusError {
  constructor(keyspace: string, table: string) {
    super(
      404,
      'Table Not Found',
      `The table "${keyspace}"."${table}" could not be found.`,
      'Please check the keyspace and table name. Note, some drivers permit creation of case-sensitive keyspace ' +
        'and table names. Please ensure you have the exact case-sensitive spelling.',
    );
  }
}
