import Transport from 'winston-transport';

/**
 * The Logger exposes a seam via the ILoggerProvider interface
 * for using custom log transports.
 */
export interface ILoggerProvider {
  /**
   * Return an array of Winston Transports.
   * @param isProd Indicates if the app is currently running in the prod environment or not.
   */
  getTransports(isProd: boolean): Transport[];
}
