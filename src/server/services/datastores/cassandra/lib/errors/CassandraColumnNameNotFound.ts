import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraColumnNameNotFound extends HttpStatusError {
  constructor(keyspace: string, table: string, columnName: string) {
    super(
      400,
      `Column name ${columnName} not found`,
      `Operation on table "${keyspace}"."${table}" failed due to missing column "${columnName}".`,
      'Please check the statement to ensure a valid primary key was provided. The primary key consists of ' +
        'all partition keys and clustering columns.',
    );
  }
}
