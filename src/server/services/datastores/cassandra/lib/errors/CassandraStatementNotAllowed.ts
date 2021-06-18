import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraStatementNotAllowed extends HttpStatusError {
  constructor(query: string, remediation: string) {
    super(
      400,
      'Statement Not Allowed',
      `The query includes statements that are not permitted: "${query.trim()}"`,
      remediation,
    );
  }
}
