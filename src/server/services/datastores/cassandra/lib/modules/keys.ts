import loggerFactory from '@/config/logger';
import { Client, QueryOptions, metadata } from 'cassandra-driver';
import {
  CassEncoding,
  IKeyQuery,
  IKeyResult,
  ITableColumn,
  ITableSchema,
  IRowDetails,
  IKeyQueryOptions,
} from '../../typings/cassandra';
import * as config from '../cassandra-config';
import {
  CassandraNoFieldsToUpdate,
  CassandraPrimaryKeyMissing,
  CassandraQueryError,
} from '../errors';
import { getAdditionalQueryColumnNames } from '../utils/schema-utils';
import {
  buildInsertStatement,
  deleteStatement,
  updateStatement,
} from '../utils/statement-utils';
import { buildTypeHints } from '../utils/type-utils';
import { checkCompletePrimaryKey } from '../utils/validation-utils';
import { mapColumn } from './columns';
import { Insert, Select } from './query-builder';
import { getTable } from './tables';
import { mapResultRow } from '../utils/row-utils';
import { CassandraCreateOrUpdateError } from '../errors/CassandraCreateOrUpdateError';

const logger = loggerFactory(module);

export async function getKeys(
  client: Client,
  keyspace: string,
  table: string,
  params: IKeyQuery,
  pageState: string | undefined,
  logMetadata: any,
): Promise<IKeyResult> {
  const INVALID_CHARS = /[^a-zA-Z0-9_]/;
  if (keyspace.match(INVALID_CHARS)) {
    throw new Error(`invalid keyspace name ${keyspace}`);
  }
  if (table.match(INVALID_CHARS)) {
    throw new Error(`invalid table name ${table}`);
  }

  const schema = await getTable(client, keyspace, table);
  const includedColumns = getIncludedColumns(schema, params.options);

  const options: QueryOptions = {
    pageState,
    fetchSize: config.fetchSize || 100,
    prepare: false,
    isIdempotent: true,
  };

  const { columns, values } = getValueBindings(schema, params.primaryKey);
  // if query parameters have been provided, build the WHERE clause
  if (columns.length > 0) {
    options.prepare = true;
    options.hints = buildTypeHints(schema, columns);
  }

  const additionalColumns = getAdditionalQueryColumnNames(schema);
  const query = new Select.Builder()
    .columns(includedColumns.map((column) => column.name))
    .columnsTtl(additionalColumns)
    .columnsWriteTime(additionalColumns)
    .from(keyspace, table)
    .where(Object.keys(params.primaryKey))
    .limit(options.fetchSize) // append a LIMIT in addition to using fetchSize to guard against fetchSize being ignored by the driver.
    .build();

  logger.info(
    `prepared query: ${query} with bindings: ${JSON.stringify(
      values,
    )} and fetchSize: ${options.fetchSize}`,
    logMetadata,
  );
  const queryStartTime = Date.now();

  try {
    const { columns, rows, pageState, info } = await client.execute(
      query,
      values,
      options,
    );

    logger.info(
      `elapsed query: ${
        Date.now() - queryStartTime
      } ms -- query: ${query} with bindings: ${JSON.stringify(
        values,
      )} and fetchSize: ${options.fetchSize}`,
      logMetadata,
    );
    const columnNames = columns.map((column) => column.name);
    return {
      columns: (columns as metadata.ColumnInfo[]).map(mapColumn),
      rows: rows.map((row) =>
        mapResultRow(row, columnNames, schema, params.options),
      ),
      pageState,
      warnings: info.warnings,
      truncatedColumns: [],
    };
  } catch (err) {
    logger.error(
      `Failed to execute: ${query} with bindings: ${JSON.stringify(values)}
        and fetchSize: ${options.fetchSize}, due to: "${err.message}"`,
      logMetadata,
    );
    throw new CassandraQueryError(query, err.message);
  }
}

/**
 * Fetches the set of columns to include in a query based on the retrieval options
 * and the column types.
 */
function getIncludedColumns(schema: ITableSchema, options: IKeyQueryOptions) {
  const { columns, primaryKey } = schema;
  const { encoding, decodeValues } = options;

  let includedColumns: ITableColumn[];
  if (encoding) {
    if (decodeValues) {
      includedColumns = columns;
    } else {
      const pkSet = primaryKey.reduce(
        (set, key) => set.add(key.name),
        new Set<string>(),
      );
      includedColumns = columns.filter(
        ({ name, type }) => !type.includes('blob') || pkSet.has(name),
      );
    }
  } else {
    includedColumns = columns.filter((col) => !col.type.includes('blob'));
  }
  return includedColumns;
}

export async function deleteKey(
  client: Client,
  keyspace: string,
  table: string,
  key: IKeyQuery,
  logMetadata: any,
): Promise<boolean> {
  const schema = await getTable(client, keyspace, table);
  // safety check, ensure someone doesn't craft a URL to delete by partition key only.
  checkCompletePrimaryKey(schema, key);
  const command = deleteStatement(keyspace, table, schema, key);
  logger.info(`deleting record: ${command}`, logMetadata);
  await client.execute(command);
  logger.info('deleted record successfully', logMetadata);
  return true;
}

export async function insertKey(
  client: Client,
  keyspace: string,
  table: string,
  row: IRowDetails,
  logMetadata: any,
): Promise<boolean> {
  const schema = await getTable(client, keyspace, table);
  if (Object.keys(row).length === 0) {
    throw new CassandraNoFieldsToUpdate(keyspace, table);
  }
  const insertStatement = buildInsertStatement(keyspace, table, row);
  logger.info(`performing insert: ${insertStatement}`, logMetadata);

  const { columns, values } = getValueBindings(schema, row);

  try {
    await client.execute(insertStatement, values, {
      hints: buildTypeHints(schema, columns),
    });
    logger.info('updated record successfully .', logMetadata);
  } catch (err) {
    throw new CassandraCreateOrUpdateError(err.message);
  }
  return true;
}

export async function updateKey(
  client: Client,
  keyspace: string,
  table: string,
  key: IKeyQuery,
  updateFields: IRowDetails,
  logMetadata: any,
): Promise<boolean> {
  const schema = await getTable(client, keyspace, table);
  const { primaryKey } = key;

  if (Object.keys(primaryKey).length === 0) {
    throw new CassandraPrimaryKeyMissing(keyspace, table);
  }
  checkCompletePrimaryKey(schema, key);
  if (Object.keys(updateFields).length === 0) {
    throw new CassandraNoFieldsToUpdate(keyspace, table);
  }

  const stmt = updateStatement(keyspace, table, schema, key, updateFields);
  logger.info(`performing update: ${stmt}`, logMetadata);

  const { columns, values } = getValueBindings(schema, updateFields, true);
  await client.execute(stmt, values, {
    hints: buildTypeHints(schema, columns),
  });
  logger.info('updated record successfully .', logMetadata);
  return true;
}

export function generateInsertStatement(
  schema: ITableSchema,
  fields: { [columnName: string]: any },
  encoding: CassEncoding,
): string {
  const builder = new Insert.Builder().into(schema).encoding(encoding);
  for (const [column, value] of Object.entries(fields)) {
    builder.value(column, value);
  }
  return builder.build();
}

/**
 * Extracts the columns and values
 * @param row The row details
 */
function getValueBindings(
  schema: ITableSchema,
  row: IRowDetails,
  skipCounters = false,
) {
  const columnMap = schema.columns.reduce(
    (prev, curr) => prev.set(curr.name, curr),
    new Map<string, ITableColumn>(),
  );

  return Object.entries(row).reduce(
    (prev, [key, details]) => {
      if (skipCounters && columnMap.get(key)?.type === 'counter') {
        return prev;
      }

      const { value, options } = details;
      const { encoding } = options;
      prev.columns.push(key);
      if (encoding && value !== undefined) {
        if (
          encoding === 'hex' &&
          typeof value === 'string' &&
          value.startsWith('0x')
        ) {
          prev.values.push(Buffer.from(value.substring(2), encoding));
        } else {
          prev.values.push(Buffer.from(value, encoding));
        }
      } else {
        prev.values.push(value);
      }
      return prev;
    },
    {
      columns: new Array<string>(),
      values: new Array<string | Buffer>(),
    },
  );
}
