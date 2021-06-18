import HttpStatusError from '@/model/errors/HttpStatusError';

export class KeyExistsError extends HttpStatusError {
  constructor(key: string) {
    super(
      409,
      'Key Already Exists',
      `Key already exists with name: "${key}".`,
      'Please provide a unique name to create a new key.',
    );
  }
}
