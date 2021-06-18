import HttpStatusError from '@/model/errors/HttpStatusError';

export class KeyTooLargeError extends HttpStatusError {
  constructor(key: string, keyCharacters: number) {
    super(
      413,
      'Key Too Large',
      `Key value is too large (${keyCharacters} characters) to be returned: ${key}.`,
      'Please use another means to load this key.',
    );
  }
}
