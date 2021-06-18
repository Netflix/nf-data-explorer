export default class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly message: string,
    readonly remediation: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
