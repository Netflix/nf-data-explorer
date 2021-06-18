import setupLogger from '@/config/logger';
import { IExplorer } from '@/services/datastores/base/datastore';
import {
  ICassandraAccessDef,
  IClusterSchemaColumn,
  ICreateTableOptions,
  IDatacenter,
  IKeyResult,
  IKeyspace,
  IKeyspaceReplication,
  IStatementResult,
  ITableSchema,
  ITableSummary,
  IUserDefinedType,
  IClusterInfo,
  IKeyQuery,
  CassEncoding,
  IRowDetails,
  IStatementExecuteOptions,
} from '@/services/datastores/cassandra/typings/cassandra';
import { Client } from 'cassandra-driver';
import { getBinaryValue } from './modules/blob';
import { getClusterSchema } from './modules/columns';
import {
  deleteKey,
  generateInsertStatement,
  getKeys,
  insertKey,
  updateKey,
} from './modules/keys';
import { getKeyspace, getKeyspaces } from './modules/keyspaces';
import {
  createKeyspace,
  createTable,
  createTableAdvanced,
  dropTable,
  generateCreateStatement,
  truncateTable,
} from './modules/schema';
import { execute } from './modules/statement';
import { getTable, getTables } from './modules/tables';
import { getTypes } from './modules/types';
import { getVersion } from './utils/cluster-utils';

const logger = setupLogger(module);

export default class CassandraExplorer implements IExplorer {
  /**
   * Create an instance of the CassandraExplorer by wrapping an existing cassandra driver client instance.
   * @param client
   */
  constructor(readonly client: Client) {}

  /**
   * Fetches the list of datacenters (regions) this cluster spans. Each datacenter returned will
   * include the list of racks (AZs).
   * @returns Returns an array of datacenters.
   */
  public async getDatacenters(): Promise<IDatacenter[]> {
    logger.info('fetching cluster regions');
    await this.client.connect();
    const datacenters = this.client.metadata.datacenters;
    return Object.keys(datacenters)
      .sort()
      .map((datacenter) => ({
        name: datacenter,
        racks: datacenters[datacenter].racks.toArray(),
      }));
  }

  /**
   * Creates a new Keyspace.
   * @param keyspaceName    Name of the new keyspace.
   * @param datacenters     Map of datacenter names to az count (e.g. { "us-east": 1 }).
   * @returns Returns a Promise that will be resolved with the value of
   *          true if successful. Rejects with error if the request fails.
   */
  public async createKeyspace(
    keyspaceName: string,
    datacenters: IKeyspaceReplication,
  ): Promise<boolean> {
    return createKeyspace(this.client, keyspaceName, datacenters);
  }

  /**
   * Permanently and irreversibly destroys a table schema and all data.
   * @param keyspaceName Keyspace containing the table to drop.
   * @param tableName Name of the table to drop.
   */
  public async dropTable(
    keyspaceName: string,
    tableName: string,
  ): Promise<IStatementResult> {
    return dropTable(this.client, keyspaceName, tableName);
  }

  /**
   * Permanently and irreversibly destroys all data in a table.
   * @param keyspaceName Keyspace containing the table to truncate.
   * @param tableName Name of the table to truncate.
   */
  public async truncateTable(
    keyspaceName: string,
    tableName: string,
  ): Promise<IStatementResult> {
    return truncateTable(this.client, keyspaceName, tableName);
  }

  /**
   * Generates a CREATE TABLE statement which can be passed to the driver to execute.
   * @param  tableOptions The table options.
   * @return Returns a Promise that will resolve with the generated CREATE TABLE statement.
   */
  public async generateCreateStatement(
    tableOptions: ICreateTableOptions,
  ): Promise<string> {
    return generateCreateStatement(this.client, tableOptions);
  }

  /**
   * Executes a CREATE TABLE statement using the given table options.
   * @param  options The creation options
   * @return Returns a Promise containing the result of the table creation operation.
   */
  public async createTable(
    options: ICreateTableOptions,
    clusterAcccess: ICassandraAccessDef,
  ): Promise<any> {
    return createTable(this.client, options, clusterAcccess);
  }

  /**
   * Executes a CREATE TABLE statement using the given table options.
   * @param  options The creation options
   * @return Returns a Promise containing the result of the table creation operation.
   */
  public async createTableAdvanced(
    keyspace: string,
    table: string,
    createStatement: string,
    clusterAcccess: ICassandraAccessDef,
  ): Promise<any> {
    return createTableAdvanced(
      this.client,
      keyspace,
      table,
      createStatement,
      clusterAcccess,
    );
  }

  public async getClusterInfo(): Promise<IClusterInfo> {
    return {
      version: getVersion(this.client),
    };
  }

  /**
   * Fetches the complete list of defined keyspaces.
   * @returns Returns a Promise that resolves with the list of keyspaces.
   */
  public async getKeyspaces(): Promise<IKeyspace[]> {
    return getKeyspaces(this.client);
  }

  /**
   * Fetches a given keyspace by name.
   * @param keyspaceName    Keyspace name.
   * @returns  Returns a Promise that resolves with the keyspace if found.
   */
  public async getKeyspace(keyspaceName: string): Promise<IKeyspace> {
    return getKeyspace(this.client, keyspaceName);
  }

  /**
   * Fetches the list of tables for the current cluster. Can be optionally scoped by keyspace.
   * @param   keyspace    Optionally can be used to scope the results to a specific keyspace.
   * @returns Returns a promise that resolves with the list of tables.
   */
  public async getTables(
    keyspace: string | undefined,
  ): Promise<ITableSummary[]> {
    return getTables(this.client, keyspace);
  }

  /**
   * A batch style query for fetching the entire schema for the current cluster. This will return a mapping
   * of keyspaces to tables and from tables to columns. Includes column type information.
   *
   * This is a fairly expensive operation and is intended for clients to cache the data and call this API
   * infrequently in order to refresh the cache.
   *
   * @param   keyspace Optional keyspace to filter by.
   * @returns Returns a flat array of column definitions per table, per keyspace.
   */
  public async getClusterSchema(
    keyspace?: string,
  ): Promise<IClusterSchemaColumn[]> {
    return getClusterSchema(this.client, keyspace);
  }

  /**
   * Fetches the schema definition for a given table.
   * @param   keyspace      The name of the keyspace that contains the table.
   * @param   table         The name of the table.
   * @returns Returns a promise that will be resolved with the table metadata.
   */
  public async getTable(
    keyspace: string,
    table: string,
  ): Promise<ITableSchema> {
    return getTable(this.client, keyspace, table);
  }

  /**
   * The data types supported by a C* cluster varies depending on the version and keyspace (since UDTs are scoped
   * by keyspace).
   * @param   keyspaceName    The name of the keyspace.
   * @return  {Promise.<{standard: Array.<*>, user}>}     Returns a Promise that will be resolved with an object
   *                                                      containing the standard and user types.
   */
  public async getTypes(
    keyspaceName: string,
  ): Promise<{ standard: string[]; user: IUserDefinedType[] }> {
    return getTypes(this.client, keyspaceName);
  }

  /**
   * Executes a freeform query. Expects the query to include the fully qualified table name (i.e. <keyspace>.<table>).
   * @param query                    The query string to submit.
   * @param clusterAccess
   * @param logMetadata              Optional object to include in logger messages.
   * @returns Returns a Promise that will resolve with the statement result.
   */
  public async execute(
    query: string,
    clusterAccess: ICassandraAccessDef,
    logMetadata: any,
    options?: IStatementExecuteOptions,
  ): Promise<IStatementResult> {
    return execute(this.client, query, clusterAccess, logMetadata, options);
  }

  /**
   * Fetches results by keys.
   * @param   {String}        keyspace    The keyspace name.
   * @param   {String}        table       The table name.
   * @param   {Object}        params      Parameterized object containing the fields to filter by.
   * @param   {String}        pageState   An optional existing cursor.
   * @param   {Object}        logMetadata Optional object to include in logger messages.
   * @returns {Promise.<TResult>|*}
   */
  public async getKeys(
    keyspace: string,
    table: string,
    params: IKeyQuery,
    pageState: string | undefined,
    logMetadata: any,
  ): Promise<IKeyResult> {
    return getKeys(
      this.client,
      keyspace,
      table,
      params,
      pageState,
      logMetadata,
    );
  }

  public generateInsertStatement(
    schema: ITableSchema,
    fields: { [columnName: string]: any },
    encoding: CassEncoding,
  ): string {
    return generateInsertStatement(schema, fields, encoding);
  }

  public async getBinaryValue(
    keyspace: string,
    table: string,
    keyQuery: IKeyQuery,
    binaryColumnName: string,
  ): Promise<Buffer | null> {
    return getBinaryValue(
      this.client,
      keyspace,
      table,
      keyQuery,
      binaryColumnName,
    );
  }

  /**
   * Updates an existing record.
   *
   * @param   keyspace         The name of the keyspace the table belongs to.
   * @param   table            The name of the table to perform the UPDATE on.
   * @param   key       A map of primary key pairs where the keys are the name of the primary key fields
   *                           and the values are the primary key values. This is used to locate the record to
   *                           update.
   * @param   updateFields     A map of the fields to update. The keys are the names of the columns and the
   *                                    values are the values for each of the columns. Must be non-empty.
   * @param   logMetadata      Additional log metadata to include (optional).
   * @returns Returns true if the record was updated. False indicates ta
   */
  public async updateKey(
    keyspace: string,
    table: string,
    key: IKeyQuery,
    updateFields: { [columnName: string]: any },
    logMetadata: any,
  ): Promise<boolean> {
    return updateKey(
      this.client,
      keyspace,
      table,
      key,
      updateFields,
      logMetadata,
    );
  }

  /**
   * Inserts a new record.
   * @param keyspace    The keyspace name.
   * @param table       The table to insert into.
   * @param fields      The map of fields to values.
   * @param logMetadata Additional log metadata to include (optional).
   */
  public async insertKey(
    keyspace: string,
    table: string,
    row: IRowDetails,
    logMetadata: any,
  ): Promise<boolean> {
    return insertKey(this.client, keyspace, table, row, logMetadata);
  }

  /**
   * Deletes an existing record.
   *
   * @param   keyspace         The name of the keyspace the table belongs to.
   * @param   table            The name of the table to perform the UPDATE on.
   * @param   key              A map of primary key pairs where the keys are the name of the primary key fields
   *                           and the values are the primary key values. This is used to locate the record to
   *                           delete.
   * @param   logMetadata      Additional log metadata to include (optional).
   * @return  Returns true if the record was deleted successfully.
   */
  public async deleteKey(
    keyspace: string,
    table: string,
    key: IKeyQuery,
    logMetadata: any,
  ): Promise<boolean> {
    return deleteKey(this.client, keyspace, table, key, logMetadata);
  }

  public shutdown(): Promise<void> {
    return this.client.shutdown();
  }
}
