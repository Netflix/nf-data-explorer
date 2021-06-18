import { getConfig } from '@/config/configuration';
import setupLogger from '@/config/logger';
import BaseDiscoveryProvider from '@/services/discovery/providers/BaseDiscoveryProvider';
import { IClusterDefinition } from '@/typings/typings';
import { existsSync, readFile, watch } from 'fs';
import ajv from 'ajv';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);

const { DISCOVERY_PROVIDER_FILESYSTEM_SOURCE } = getConfig();

const logger = setupLogger(module);

/**
 * A filesystem based implementation of the DiscoveryStrategy.
 *
 * This implementation provides a way to discovery Dynomite clusters using
 * a file on the filesystem. Once 'load' is called, this instance
 * will watch the given file for changes. Any updates to the file will
 * update to the list of clusters.
 */
export default class FileSystemDiscoveryProvider extends BaseDiscoveryProvider {
  private discoverySchema: string | undefined = undefined;
  private discoveryJson = `./data/${DISCOVERY_PROVIDER_FILESYSTEM_SOURCE}`;

  /**
   * @inheritdoc
   */
  public start(): void {
    if (!existsSync(this.discoveryJson)) {
      throw new Error(`Could not find discovery file: ${this.discoveryJson}`);
    }

    watch(this.discoveryJson, (eventType, filename) => {
      if (filename && eventType === 'change') {
        logger.info(`detected change to ${this.discoveryJson}`);
        this.readDiscoveryFile();
      }
    });
    this.readDiscoveryFile();
  }

  private async readDiscoveryFile() {
    try {
      if (!this.discoverySchema) {
        this.discoverySchema = await readFileAsync(
          'schema/discovery-schema.json',
          'utf-8',
        );
      }

      const data = await readFileAsync(this.discoveryJson, 'utf8');
      const clusters = JSON.parse(data) as IClusterDefinition[];

      const validator = new ajv({
        allErrors: true,
        strict: false,
      });
      const validate = validator.compile(JSON.parse(this.discoverySchema));
      const isValid = await validate(clusters);

      if (!isValid) {
        const errorMsgs = (validate?.errors ?? [])
          .map((error) => `  [${error.dataPath}] - ${error.message}`)
          .join('; ');
        logger.error(errorMsgs);
        throw new Error('Invalid content found in discovery file');
      }

      this.clusters = clusters;
    } catch (err) {
      this.emit('error', err);
    }
  }
}
