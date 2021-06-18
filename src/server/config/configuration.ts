import { difference } from '@/utils/set-utils';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import * as baseConfig from './base-config';

let config: typeof baseConfig | undefined;

const isTestEnv = process.env.NODE_ENV === 'test';

export function init(): void {
  if (config && !isTestEnv) {
    throw new Error(
      'config has already been loaded. `init` should only be called once at app startup.',
    );
  }

  // check for available configuration overrides
  const path = join(__dirname, '/overrides');

  if (!existsSync(path)) {
    console.warn(`Configuration overrides directory is empty.
      Expected to find an overridden config file in: ${path}.
      Please ensure you have run "yarn setup" to generate a config file.`);
    config = baseConfig;
    return;
  }

  const availableOverrides = readdirSync(path)
    .filter((filename) => filename.endsWith(isTestEnv ? '.ts' : '.js'))
    .map((filename) => filename.split('.')[0]);

  const envConfigName = 'DATA_EXPLORER_CONFIG_NAME';
  const useEnvOverride = process.env[envConfigName];
  if (availableOverrides.length > 1 && !useEnvOverride) {
    throw new Error(
      `Multiple override files found: ${path}. Found: ${JSON.stringify(
        availableOverrides,
      )}. If a single config file exists it will be used, but if multiple
      files exist, you must set environment variable "${envConfigName}".`,
    );
  } else if (useEnvOverride) {
    if (availableOverrides.indexOf(useEnvOverride) < 0) {
      throw new Error(
        `Could not find an override named "${useEnvOverride}". Available overrides:
        ${JSON.stringify(
          availableOverrides,
        )}. If you just added a new .ts override file, please ensure you have run a build.`,
      );
    }
    console.log(`Loading config override: ${useEnvOverride}`);
    config = loadConfig(`@/config/overrides/${useEnvOverride}`);
  } else {
    // no override specified - just use base config
    console.log(`No environment overrides found. Defaulting to base config...`);
    config = baseConfig;
  }
}

/**
 * Loads the configuration for the app. First the base configuration will be loaded and any
 * overrides present in the `overrides` directory will be applied on top.
 */
export function loadConfig(configModule: string): typeof baseConfig {
  /* eslint-disable-next-line @typescript-eslint/no-var-requires */
  const customConfig = require(configModule);
  const newCustomProperties = difference(
    new Set(Object.getOwnPropertyNames(customConfig)),
    new Set(Object.getOwnPropertyNames(baseConfig)),
  );
  for (const propName of newCustomProperties) {
    console.warn(
      `Found new property "${propName}" in custom configuration override. Do you have a typo in the name of your property?`,
    );
  }
  return Object.assign({}, baseConfig, customConfig);
}

/**
 * Fetches the configuration.
 * Expects `init` to have been called already.
 * @see init
 */
export function getConfig(): typeof baseConfig {
  if (config === undefined) {
    throw new Error(
      'config is currently undefined. please ensure `init` is called during initialization',
    );
  }
  return JSON.parse(JSON.stringify(config)) as typeof baseConfig;
}
