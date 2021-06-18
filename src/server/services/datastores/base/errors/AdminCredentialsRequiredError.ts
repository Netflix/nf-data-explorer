import HttpStatusError from '@/model/errors/HttpStatusError';

export default class AdminCredentialsRequiredError extends HttpStatusError {
  constructor() {
    super(
      401,
      'Administrator Credentials Required',
      'Administrator credentials are required for this operation.',
    );
  }
}
