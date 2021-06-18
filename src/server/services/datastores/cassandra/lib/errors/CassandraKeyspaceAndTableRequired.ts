import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraKeyspaceAndTableRequired extends HttpStatusError {
  constructor() {
    super(
      400,
      'Fully qualified keyspace and table name is required',
      'This operation requires a fully qualified keyspace and table name (case-sensitive).',
      'Please check your keyspace and table name.',
    );
  }
}
