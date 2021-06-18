import HttpStatusError from './HttpStatusError';

export default class AuthenticationError extends HttpStatusError {
  constructor(message: string, remediation: string) {
    super(401, 'Failed to authenticate', message, remediation);
  }
}
