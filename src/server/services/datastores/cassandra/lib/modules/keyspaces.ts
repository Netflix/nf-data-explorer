import loggerFactory from '@/config/logger';
import { Client, ICassandraKeyspace } from 'cassandra-driver';
import { sortBy } from 'lodash';
import { IKeyspace } from '../../typings/cassandra';
import { CassandraKeyspaceNotFound } from '../errors';
import { getClassName } from '../utils/schema-utils';

const logger = loggerFactory(module);

function mapKeyspace(keyspace: ICassandraKeyspace): IKeyspace {
  const { name, strategy, strategyOptions } = keyspace;
  return { name, strategy: getClassName(strategy), strategyOptions };
}

export async function getKeyspaces(client: Client): Promise<IKeyspace[]> {
  logger.info('fetching keyspaces');
  await client.connect();
  logger.info('fetched all keyspaces');
  const keyspaces = (Object.values(
    client.metadata.keyspaces,
  ) as ICassandraKeyspace[]).map(mapKeyspace);
  return sortBy(keyspaces, 'name');
}

export async function getKeyspace(
  client: Client,
  keyspaceName: string,
): Promise<IKeyspace> {
  logger.info(`fetching keyspace: ${keyspaceName}`);
  await client.connect();
  const keyspace = client.metadata.keyspaces[
    keyspaceName
  ] as ICassandraKeyspace; // TODO cast required until driver types are updated https://datastax-oss.atlassian.net/browse/NODEJS-558
  if (!keyspace) {
    throw new CassandraKeyspaceNotFound(keyspaceName);
  }
  logger.info(`fetched keyspace "${keyspaceName}"`);
  return mapKeyspace(keyspace);
}
