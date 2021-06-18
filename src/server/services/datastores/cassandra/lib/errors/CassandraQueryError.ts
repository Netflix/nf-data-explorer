import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraQueryError extends HttpStatusError {
  constructor(readonly query: string, readonly reason: string) {
    super(
      400,
      'Failed to execute query',
      reason,
      'Please check your CQL statement.',
    );
  }
}
