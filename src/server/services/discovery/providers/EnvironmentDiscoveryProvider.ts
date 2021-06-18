import { getConfig } from '@/config/configuration';
import loggerFactory from '@/config/logger';
import BaseDiscoveryProvider from '@/services/discovery/providers/BaseDiscoveryProvider';
import { IClusterDefinition } from '@/typings/typings';

const logger = loggerFactory(module);

/**
 * An environment variable based DiscoveryService.
 *
 * This implementation provides a simple way to connect to datastores using hostnames/IPs
 * pulled from the environment.
 */
export default class EnvironmentDiscoveryProvider extends BaseDiscoveryProvider {
  constructor(readonly port: number) {
    super();
  }

  /**
   * @inheritdoc
   */
  public start(): void {
    const {
      SUPPORTED_DATASTORE_TYPES,
      DISCOVERY_PROVIDER_ENVIRONMENT_CASSANDRA_HOST,
      DISCOVERY_PROVIDER_ENVIRONMENT_REDIS_HOST,
    } = getConfig();

    const cassandraHost =
      process.env[DISCOVERY_PROVIDER_ENVIRONMENT_CASSANDRA_HOST];
    const redisHost = process.env[DISCOVERY_PROVIDER_ENVIRONMENT_REDIS_HOST];

    const clusters = new Array<IClusterDefinition>();

    if (SUPPORTED_DATASTORE_TYPES.includes('cassandra')) {
      logger.info(`Using cassandra host: ${cassandraHost}`);
      if (!cassandraHost) {
        throw new Error(
          `${DISCOVERY_PROVIDER_ENVIRONMENT_CASSANDRA_HOST} environment variable not set.`,
        );
      }
      clusters.push(
        this.buildCluster(cassandraHost, cassandraHost, 'cassandra'),
      );
    }
    if (
      SUPPORTED_DATASTORE_TYPES.includes('dynomite') ||
      SUPPORTED_DATASTORE_TYPES.includes('redis')
    ) {
      logger.info(`Using redis host: ${redisHost}`);
      if (!redisHost) {
        throw new Error(
          `${DISCOVERY_PROVIDER_ENVIRONMENT_REDIS_HOST} environment variable not set.`,
        );
      }
      clusters.push(this.buildCluster(redisHost, redisHost, 'dynomite'));
    }

    this.clusters = clusters;
    this.environments = ['local'];
    this.regions = ['local'];
  }

  private buildCluster(
    name: string,
    ip: string,
    type: 'cassandra' | 'dynomite',
  ): IClusterDefinition {
    return {
      name,
      env: 'local',
      region: 'local',
      datastoreType: type,
      instances: [
        {
          az: 'local',
          hostname: name,
          ip,
          status: 'UP',
          stack: '',
        },
      ],
    };
  }
}
