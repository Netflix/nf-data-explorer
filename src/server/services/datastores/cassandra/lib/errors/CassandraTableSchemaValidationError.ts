import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraTableSchemaValidationError extends HttpStatusError {
  constructor(
    readonly columnName: string,
    readonly columnType: string,
    message: string,
    remediation: string,
  ) {
    super(400, 'Table validation error', message, remediation);
  }
}
