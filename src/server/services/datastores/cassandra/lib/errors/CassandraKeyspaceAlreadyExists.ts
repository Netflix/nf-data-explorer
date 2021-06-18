import HttpStatusError from '@/model/errors/HttpStatusError';

export class CassandraKeyspaceAlreadyExists extends HttpStatusError {
  constructor(keyspace: string) {
    super(
      409,
      'Keyspace already exists',
      `The keyspace "${keyspace}" already exists.`,
      'Please choose a different name for the new keyspace.',
    );
  }
}
