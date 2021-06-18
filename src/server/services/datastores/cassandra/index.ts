import { getConfig } from '@/config/configuration';
import setupLogger from '@/config/logger';
import { IDatastoreService } from '@/services/datastores/base/datastore';
import CassandraExplorer from '@/services/datastores/cassandra/lib/CassandraExplorer';
import { ICassandraConnectParams } from '@/services/datastores/cassandra/typings/cassandra';
import { Client, types } from 'cassandra-driver';
import BaseDatastoreService from '../base/BaseDatastoreService';
import { fetchSize } from './lib/cassandra-config';
import { ICassandraClientOptionsProvider } from './lib/providers/client/ICassandraClientOptionsProvider';

const { CASSANDRA_PORT, CLUSTER_NAME_PATTERN_CASSANDRA } = getConfig();

const logger = setupLogger(module);

export default class CassandraDatastoreService extends BaseDatastoreService
  implements IDatastoreService<CassandraExplorer> {
  constructor(readonly clientOptionsProvider: ICassandraClientOptionsProvider) {
    super();
  }

  public getDatastoreType(): string {
    return 'cassandra';
  }

  public connect(params: ICassandraConnectParams): Promise<CassandraExplorer> {
    const { clusterDescription, instances, region } = params;
    if (!instances) {
      return Promise.reject('instances must be provided');
    }

    return new Promise(async (resolve, reject) => {
      const contactPoints = new Array<string>();
      const addressMap = {} as {
        [ip: string]: string;
      };
      instances.forEach((instance) => {
        if (instance.status === 'UP') {
          contactPoints.push(instance.ip);
        }
        addressMap[instance.ip] = instance.hostname;
      });
      logger.info(`setting up new connection to ${params.clusterDescription}`);

      const { clientOptionsProvider: provider } = this;
      const sslOptions = await provider.getSslOptions(params);

      const client = new Client({
        contactPoints,
        localDataCenter: provider.getLocalDatacenter(region),
        protocolOptions: {
          port: CASSANDRA_PORT,
        },
        authProvider: provider.getAuthProvider(undefined, undefined),
        sslOptions,
        policies: provider.getPolicies(region),
        queryOptions: {
          fetchSize: fetchSize || 100,
          prepare: true,
          captureStackTrace: true,
          consistency: types.consistencies.localOne,
        },
      });
      client.on('log', (level, _module, message) => {
        if (level === 'verbose') {
          return;
        }
        logger.debug(`-- [${level}] ${message}`);
      });
      client.on('hostAdd', (host) => {
        logger.debug(
          `cluster ${clusterDescription} added host: ${JSON.stringify(host)}`,
        );
      });
      client.on('hostRemove', (host) => {
        logger.debug(
          `cluster ${clusterDescription} removed host: ${JSON.stringify(host)}`,
        );
      });
      client.on('hostUp', (host) => {
        logger.debug(
          `cluster ${clusterDescription} detected host came up: ${JSON.stringify(
            host,
          )}`,
        );
      });
      client.on('hostDown', (host) => {
        logger.debug(
          `cluster ${clusterDescription} detected host went down: ${JSON.stringify(
            host,
          )}`,
        );
      });

      try {
        await client.connect();
      } catch (err) {
        return reject(err);
      }

      resolve(new CassandraExplorer(client));
    });
  }

  public discoveryCallback(appName: string): boolean {
    return new RegExp(CLUSTER_NAME_PATTERN_CASSANDRA, 'i').test(appName);
  }
}
