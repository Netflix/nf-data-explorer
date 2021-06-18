import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraStatementUnparseableError extends HttpStatusError {
  constructor(readonly query: string) {
    super(
      400,
      'Unable to parse keyspace and table name',
      `Unable to parse the keyspace and table from "${query}"`,
      'Please check your CQL statement.',
    );
  }
}
