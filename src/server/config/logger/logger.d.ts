interface ILogger {
  info(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
}
