import HttpStatusError from '@/model/errors/HttpStatusError';

export class FieldOperationsNotSupportedForTypeError extends HttpStatusError {
  constructor(key: string, keyType: string, supportedKeyTypes: string[]) {
    super(
      400,
      'Field Operations Not Supported on Key Type',
      `Field level operations are not supported for key "${key}" of type "${keyType}".
      Key must be of one of the following types "${JSON.stringify(
        supportedKeyTypes,
      )}".`,
      'Please provide a unique name to create a new key.',
    );
  }
}
