import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraNoFieldsToUpdate extends HttpStatusError {
  constructor(keyspace: string, table: string) {
    super(
      400,
      'No fields to update',
      `No updates provided. No changes have been made to "${keyspace}"."${table}".`,
      'Please check the statement to ensure you have provided the necessary updated fields.',
    );
  }
}
