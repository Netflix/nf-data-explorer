export default class HttpStatusError extends Error {
  /**
   *
   * @param status The HTTP status code.
   * @param title Message title.
   * @param message Error message.
   * @param remediation Remediation details. NOTE: will be rendered unescaped to users. If passing user-provided strings, make sure to escape them.
   */
  constructor(
    readonly status: number,
    readonly title: string,
    message: string,
    readonly remediation?: string,
  ) {
    super(message);
    this.title = title;
    this.status = status;
    this.remediation = remediation;
  }

  public getStatus(): number {
    return this.status;
  }
}
