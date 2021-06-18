export default class RequestCanceledError extends Error {
  constructor(message?: string) {
    super(message || 'request canceled');
  }
}
