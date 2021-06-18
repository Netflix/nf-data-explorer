import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraTableDropError extends HttpStatusError {
  constructor(keyspace: string, table: string, detail: string) {
    super(
      500,
      'Failed to drop table',
      `The table "${keyspace}"."${table}" could not be dropped.`,
      detail,
    );
  }
}
