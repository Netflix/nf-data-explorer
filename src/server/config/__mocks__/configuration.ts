import * as baseConfig from '../base-config';

const currentConfig = jest
  .fn()
  .mockReturnValue(JSON.parse(JSON.stringify(baseConfig)));

// tslint:disable:jsdoc-format
/**
 * Allows modification of the loaded test configuration in tests.
 *
 * Example usage
 ```
  describe('sample suite', () => {
    beforeAll(() => {
      const MockConfiguration = (await import('@/config/configuration')) as any;
      MockConfiguration.__updateConfig({
        REQUIRE_AUTHENTICATION: true,
      });
    }
    // ...
  })
 ```
 * @param testConfig New test configuration to apply on top of the base config.
 */
export function __updateConfig(testConfig = {}): void {
  currentConfig.mockReturnValue(Object.assign({}, baseConfig, testConfig));
}

export function __resetConfig(): void {
  currentConfig.mockReturnValue(baseConfig);
}

export function loadConfig(configModule: string): typeof baseConfig {
  /* eslint-disable-next-line @typescript-eslint/no-var-requires */
  const customConfig = require(configModule);
  __updateConfig(customConfig);
  const newConfig = JSON.parse(JSON.stringify(getConfig()));
  __resetConfig();
  return newConfig;
}

export function getConfig(): typeof baseConfig {
  return currentConfig();
}

export function init(): void {
  // no op
}
