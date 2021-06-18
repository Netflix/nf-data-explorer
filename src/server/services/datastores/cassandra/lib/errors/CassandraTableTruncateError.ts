import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraTableTruncateError extends HttpStatusError {
  constructor(keyspace: string, table: string, detail: string) {
    super(
      500,
      'Failed to truncate table',
      `The table "${keyspace}"."${table}" could not be truncated.`,
      detail,
    );
  }
}
