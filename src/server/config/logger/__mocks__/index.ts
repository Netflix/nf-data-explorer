export function init(): void {
  // no-op
}

const TEST_LOGGING_ENABLED = false;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function loggerFactory(_module: any): ILogger {
  return {
    debug(message: string) {
      TEST_LOGGING_ENABLED && console.debug(message);
    },
    warn(message: string) {
      TEST_LOGGING_ENABLED && console.warn(message);
    },
    info(message: string) {
      TEST_LOGGING_ENABLED && console.info(message);
    },
    error(message: string) {
      TEST_LOGGING_ENABLED && console.error(message);
    },
  };
}
