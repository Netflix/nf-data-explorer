import loggerFactory from '@/config/logger';
import {
  v2x as SchemaBuilderV2,
  v3x as SchemaBuilderV3,
} from '@/services/datastores/cassandra/lib/modules/schema-builder/SchemaBuilder';
import { Client, types } from 'cassandra-driver';
import {
  ICassandraAccessDef,
  ICreateTableOptions,
  IKeyspaceReplication,
  IStatementResult,
} from '../../typings/cassandra';
import {
  CassandraKeyspaceAlreadyExists,
  CassandraTableCreationError,
} from '../errors';
import { CassandraKeyspaceAndTableRequired } from '../errors/CassandraKeyspaceAndTableRequired';
import { CassandraTableDropError } from '../errors/CassandraTableDropError';
import { CassandraTableTruncateError } from '../errors/CassandraTableTruncateError';
import { isVersion3 } from '../utils/cluster-utils';
import { execute } from './statement';

const logger = loggerFactory(module);

/**
 * Creates a new Keyspace.
 * @param keyspaceName    Name of the new keyspace.
 * @param datacenters     Map of datacenter names to az count (e.g. { "us-east": 1 }).
 * @returns Returns a Promise that will be resolved with the value of
 *          true if successful. Rejects with error if the request fails.
 */
export async function createKeyspace(
  client: Client,
  keyspaceName: string,
  datacenters: IKeyspaceReplication,
): Promise<boolean> {
  const replicationParams = { class: 'NetworkTopologyStrategy' };
  const datacenterNames = Object.keys(datacenters);
  if (datacenterNames.length === 0) {
    throw new Error(
      `Unable to create keyspace ${keyspaceName}. At least one datacenter must be specified.`,
    );
  }

  Object.keys(datacenters).forEach((datacenter) => {
    const rackCount = datacenters[datacenter];
    if (rackCount < 1) {
      throw new Error(`Invalid rack value for datacenter: ${datacenter}`);
    }
    replicationParams[datacenter] = rackCount;
  });

  // tslint:disable
  const stmt = `
                CREATE KEYSPACE "${keyspaceName}"
                WITH REPLICATION = ${JSON.stringify(replicationParams).replace(
                  /"/g,
                  "'",
                )}
                AND DURABLE_WRITES = true`;
  // tslint:enable
  logger.debug(`Creating new keyspace using: "${stmt}"`);

  try {
    await client.execute(stmt.trim());
    return true;
  } catch (e) {
    if (e.message.toLowerCase().indexOf('cannot add existing keyspace') >= 0) {
      throw new CassandraKeyspaceAlreadyExists(keyspaceName);
    }
    throw e;
  }
}

/**
 * Generates a CREATE TABLE statement which can be passed to the driver to execute.
 * @param  tableOptions The table options.
 * @return Returns a Promise that will resolve with the generated CREATE TABLE statement.
 */
export async function generateCreateStatement(
  client: Client,
  tableOptions: ICreateTableOptions,
): Promise<string> {
  const { keyspace, table } = tableOptions;
  logger.debug(
    `Generating create statement for new table: ${keyspace}.${table}`,
  );
  await client.connect();
  const SchemaBuilder = isVersion3(client) ? SchemaBuilderV3 : SchemaBuilderV2;
  const createStatement = SchemaBuilder.createTableWithOptions(
    tableOptions,
  ).getQueryString();
  logger.debug(createStatement);
  return createStatement;
}

/**
 * Executes a CREATE TABLE statement using the given table options.
 * @param  options The creation options
 * @return Returns a Promise containing the result of the table creation operation.
 */
export async function createTable(
  client: Client,
  options: ICreateTableOptions,
  clusterAcccess: ICassandraAccessDef,
): Promise<any> {
  const { keyspace, table } = options;
  const createStatement = await generateCreateStatement(client, options);
  logger.info(`Creating new table: ${keyspace}.${table}`);
  logger.info(createStatement);
  try {
    return await execute(client, createStatement, clusterAcccess, undefined, {
      includeSchema: false,
      enforceQueryRestrictions: false,
    });
  } catch (err) {
    throw new CassandraTableCreationError(
      keyspace,
      table,
      err.reason || err.message,
    );
  }
}

/**
 * Executes a CREATE TABLE statement using the given table options.
 * @param  options The creation options
 * @return Returns a Promise containing the result of the table creation operation.
 */
export async function createTableAdvanced(
  client: Client,
  keyspace: string,
  table: string,
  createStatement: string,
  clusterAccess: ICassandraAccessDef,
): Promise<any> {
  logger.info('Creating new table with free-form query');
  logger.info(createStatement);

  if (!createStatement.toLowerCase().match(/^\s*create\s*table\s*/)) {
    throw new Error('Invalid create table statement');
  }

  try {
    return await execute(client, createStatement, clusterAccess, undefined, {
      includeSchema: false,
      enforceQueryRestrictions: false,
    });
  } catch (err) {
    throw new CassandraTableCreationError(keyspace, table, err.message);
  }
}

function validateKeyspaceAndTableName(keyspace: string, table: string) {
  if (!keyspace || !table) {
    throw new CassandraKeyspaceAndTableRequired();
  }
}

export async function dropTable(
  client: Client,
  keyspace: string,
  table: string,
): Promise<IStatementResult> {
  validateKeyspaceAndTableName(keyspace, table);
  logger.info(`Dropping table "${keyspace}"."${table}"`);
  const stmt = `DROP TABLE "${keyspace}"."${table}"`;
  try {
    return await execute(client, stmt, undefined, undefined, {
      enforceQueryRestrictions: false,
    });
  } catch (err) {
    throw new CassandraTableDropError(keyspace, table, err.message);
  }
}

export async function truncateTable(
  client: Client,
  keyspace: string,
  table: string,
): Promise<IStatementResult> {
  validateKeyspaceAndTableName(keyspace, table);
  logger.info(`Truncating table "${keyspace}"."${table}"`);
  const stmt = `TRUNCATE TABLE "${keyspace}"."${table}"`;
  try {
    return await execute(client, stmt, undefined, undefined, {
      enforceQueryRestrictions: false,
      consistency: types.consistencies.all,
    });
  } catch (err) {
    throw new CassandraTableTruncateError(keyspace, table, err.message);
  }
}
