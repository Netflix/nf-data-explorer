import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraIncorrectColumnType extends HttpStatusError {
  constructor(
    keyspace: string,
    table: string,
    columnName: string,
    columnType: string,
    expectedType: string,
  ) {
    super(
      400,
      'Incorrect column type',
      `Operation on table "${keyspace}"."${table}" failed due to incorrect column type. Column ${columnName}
      is of type ${columnType} and was expected to be of type ${expectedType}.`,
      'Please check the statement to ensure a valid primary key was provided. The primary key consists of ' +
        'all partition keys and clustering columns.',
    );
  }
}
