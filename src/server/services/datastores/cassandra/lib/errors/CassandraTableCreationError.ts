import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraTableCreationError extends HttpStatusError {
  constructor(keyspace: string, table: string, detail: string) {
    super(
      500,
      'Failed to create table',
      `The table "${keyspace}"."${table}" could not be created.`,
      detail,
    );
  }
}
