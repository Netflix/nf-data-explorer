export class HttpStatusError extends Error {
  constructor(
    readonly status: string,
    readonly title: string,
    message: string,
    readonly remediation: string,
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpStatusError);
    }
    Object.setPrototypeOf(this, HttpStatusError.prototype);
  }
}
