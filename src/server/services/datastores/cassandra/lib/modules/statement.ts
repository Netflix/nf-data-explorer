import loggerFactory from '@/config/logger';
import * as config from '@/services/datastores/cassandra/lib/cassandra-config';
import { Client, QueryOptions, metadata } from 'cassandra-driver';
import {
  ICassandraAccessDef,
  IStatementResult,
  ITableSchema,
  IStatementExecuteOptions,
  IKeyQueryOptions,
} from '../../typings/cassandra';
import {
  CassandraKeyspaceNotAccessible,
  CassandraQueryError,
  CassandraStatementUnparseableError,
} from '../errors';
import {
  isSelectQuery,
  limitSelectQuery,
  makeQueryCaseSensitive,
} from '../utils/statement-utils';
import { checkQueryRestrictions } from '../utils/validation-utils';
import { mapColumn } from './columns';
import { getTable } from './tables';
import { mapResultRow } from '../utils/row-utils';

const logger = loggerFactory(module);

/**
 * Executes a CQL statement.
 * @param client Existing client connection.
 * @param query The CQL statement to execute.
 * @param clusterAccess If cluster access is to be enforced, pass the cluster access configuration for the current user.
 * @param logMetadata Additional metadata to include in log entries.
 * @param options Statement execution options. Note: depending on the type of query, some options may be required.
 */
export async function execute(
  client: Client,
  query: string,
  clusterAccess: ICassandraAccessDef | undefined,
  logMetadata: any,
  options = {
    includeSchema: false,
    enforceQueryRestrictions: true,
  } as IStatementExecuteOptions,
): Promise<IStatementResult> {
  if (!query) {
    throw new Error('invalid query');
  }
  if (options && options.enforceQueryRestrictions) {
    checkQueryRestrictions(query);
  }

  const queryOptions: QueryOptions = {
    pageState: options.cursor,
    fetchSize: config.fetchSize || 100,
    consistency: options.consistency,
  };

  const re = new RegExp(
    '(from|into|update|create table)\\s+["]?([a-zA-Z0-9_-]*?)["]?\\.["]?([a-zA-Z0-9_-]*)["]?[\\s]?[;]?',
    'i',
  );
  const matches = re.exec(query);

  let keyspace: string | undefined = undefined;
  let table: string | undefined = undefined;
  if (matches && matches.length === 4) {
    keyspace = matches[2];
    table = matches[3];
  }

  if (clusterAccess) {
    const { isShared, userKeyspaceNames } = clusterAccess;
    if (keyspace && isShared && !userKeyspaceNames.has(keyspace)) {
      throw new CassandraKeyspaceNotAccessible(keyspace);
    }
  }

  const isSelect = isSelectQuery(query);
  let schema: ITableSchema | undefined;
  const blobColumns = new Set<string>();
  if (options && options.includeSchema) {
    if (!keyspace || !table) {
      throw new CassandraStatementUnparseableError(query);
    }
    schema = await getTable(client, keyspace, table);

    if (isSelect) {
      schema.columns.forEach((column) => {
        if (column.type.includes('blob')) {
          blobColumns.add(column.name);
        }
      });
    }
  } else {
    schema = undefined;
  }

  logger.info('starting query');
  const startTime = Date.now();

  let trimmedQuery = query.trim();
  if (trimmedQuery.endsWith(';')) {
    trimmedQuery = trimmedQuery.substr(0, trimmedQuery.length - 1);
  }
  const queryToSubmit = limitSelectQuery(
    makeQueryCaseSensitive(trimmedQuery, keyspace, table),
    config.fetchSize,
  );

  logger.info(
    `freeform query: ${queryToSubmit} with fetchSize: ${queryOptions.fetchSize}`,
    logMetadata,
  );

  try {
    const result = await client.execute(queryToSubmit, undefined, queryOptions);

    logger.info(
      `query completed: ${queryToSubmit}, with fetchSize: ${
        queryOptions.fetchSize
      }, elapsed: ${Date.now() - startTime} ms`,
      logMetadata,
    );
    const columns = result.columns || [];
    const rows = result.rows || [];

    if (rows.length > 0 && (!schema || !options.keyQueryOptions)) {
      throw new Error(
        'Statement produced results, but schema or keyQueryOptions not set.',
      );
    }

    const columnNames = columns.map((column) => column.name);
    return {
      columns: (columns as metadata.ColumnInfo[]).map(mapColumn),
      rows: rows.map((row) =>
        mapResultRow(
          row,
          columnNames,
          schema as ITableSchema,
          options.keyQueryOptions as IKeyQueryOptions,
        ),
      ),
      pageState: result.pageState,
      warnings: result.info.warnings,
      schema,
      truncatedColumns: [],
    };
  } catch (err) {
    logger.error(
      `Failed to execute: ${queryToSubmit} with fetchSize: ${queryOptions.fetchSize}, due to: "${err.message}"`,
      logMetadata,
    );
    throw new CassandraQueryError(query, err.message);
  }
}
