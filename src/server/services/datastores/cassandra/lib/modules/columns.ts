import loggerFactory from '@/config/logger';
import { Client, metadata, types } from 'cassandra-driver';
import { IClusterSchemaColumn, ITableColumn } from '../../typings/cassandra';
import { isVersion3 } from '../utils/cluster-utils';
import { streamAllResults } from '../utils/query-utils';
import { getJsType } from '../utils/type-utils';
import { Alias, Select } from './query-builder';
import { getTables } from './tables';

const logger = loggerFactory(module);

/**
 * The following types require quotes when used in where clauses.
 */
const QUOTED_TYPE_SET = new Set([
  'ascii',
  'inet',
  'text',
  'time',
  'timestamp',
  'varchar',
]);

export function mapColumn(column: metadata.ColumnInfo): ITableColumn {
  const type = types.getDataTypeNameByCode(column.type);
  const dataType = getJsType(type);
  return {
    name: column.name,
    type,
    dataType,
    options: column.type.options,
    needsQuotes: QUOTED_TYPE_SET.has(type),
  };
}

export async function getClusterSchema(
  client: Client,
  keyspace?: string,
): Promise<IClusterSchemaColumn[]> {
  await client.connect();
  const standardColumns = ['keyspace_name', 'column_name'];

  let queryBuilder = new Select.Builder();
  if (isVersion3(client)) {
    queryBuilder
      .columns([
        ...standardColumns,
        'table_name',
        new Alias('kind', 'key_type'),
      ])
      .from('system_schema', 'columns');
  } else {
    queryBuilder
      .columns([
        ...standardColumns,
        new Alias('columnfamily_name', 'table_name'),
        new Alias('type', 'key_type'),
      ])
      .from('system', 'schema_columns');
  }

  if (keyspace) {
    queryBuilder = queryBuilder.where(['keyspace_name']);
  }

  const query = queryBuilder.build();

  try {
    const [allTables, allSchemaItems] = await Promise.all([
      getTables(client, undefined),
      streamAllResults<IClusterSchemaColumn>(
        client,
        query,
        {
          keyspace_name: keyspace,
        },
        (row) => ({
          keyspace: row.keyspace_name,
          table: row.table_name,
          column: row.column_name,
          type: row.key_type ? row.key_type.replace('_key', '') : null,
          isThrift: false,
        }),
      ),
    ]);

    const tableThriftMap = allTables.reduce(
      (prev, curr) => prev.set(curr.name, curr.isThrift),
      new Map<string, boolean>(),
    );

    return allSchemaItems.map((item) => {
      const isThrift = tableThriftMap.get(item.table) ?? false;
      return { ...item, isThrift };
    });
  } catch (err) {
    logger.info(`failed to fetch all cluster schema entries: ${err.message}`);
    throw err;
  }
}
