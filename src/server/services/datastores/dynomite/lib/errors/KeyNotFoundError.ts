import HttpStatusError from '@/model/errors/HttpStatusError';

export class KeyNotFoundError extends HttpStatusError {
  constructor(key: string) {
    super(
      404,
      'Key Not Found',
      `Could not find key: "${key}".`,
      'Please verify the key name. The key may have been deleted.',
    );
  }
}
