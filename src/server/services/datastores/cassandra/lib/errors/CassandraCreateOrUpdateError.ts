import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraCreateOrUpdateError extends HttpStatusError {
  constructor(readonly reason: string) {
    super(
      400,
      'Failed to create or update record',
      reason,
      'Please check your CQL statement.',
    );
  }
}
