import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraPrimaryKeyMissing extends HttpStatusError {
  constructor(keyspace: string, table: string) {
    super(
      400,
      'Primary key missing',
      `Unable to perform updates to table "${keyspace}"."${table}" due to missing primary key.`,
      'Please check the statement to ensure a valid primary key was provided. The primary key consists of ' +
        'all partition keys and clustering columns.',
    );
  }
}
