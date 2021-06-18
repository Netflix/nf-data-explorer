import loggerFactory from '@/config/logger';
import { Client } from 'cassandra-driver';
import {
  ITableProperties,
  ITableSchema,
  ITableSummary,
} from '../../typings/cassandra';
import { CassandraTableNotFound } from '../errors';
import { isVersion3 } from '../utils/cluster-utils';
import { streamAllResults } from '../utils/query-utils';
import {
  extractCompaction,
  getCachingDetails,
  getClassName,
  getCompressionDetails,
  isThriftV2,
  isThriftV3,
} from '../utils/schema-utils';
import { validateName } from '../utils/validation-utils';
import { mapColumn } from './columns';
import { Alias, Select } from './query-builder';

const logger = loggerFactory(module);

export async function getTables(
  client: Client,
  keyspace: string | undefined,
): Promise<ITableSummary[]> {
  await client.connect();
  const standardColumns = [
    'keyspace_name',
    'comment',
    'caching',
    'gc_grace_seconds',
    'default_time_to_live',
    'speculative_retry',
  ];
  const isV3 = isVersion3(client);

  let queryBuilder = new Select.Builder();
  if (isV3) {
    queryBuilder
      .columns([
        ...standardColumns,
        new Alias('table_name', 'name'),
        'compaction',
        'compression',
        'flags',
      ])
      .from('system_schema', 'tables');
  } else {
    queryBuilder
      .columns([
        ...standardColumns,
        new Alias('columnfamily_name', 'name'),
        'compaction_strategy_class',
        'compaction_strategy_options',
        'compression_parameters',
        'comparator',
        'is_dense',
      ])
      .from('system', 'schema_columnfamilies');
  }

  if (keyspace) {
    queryBuilder = queryBuilder.where(['keyspace_name']);
  }
  const query = queryBuilder.build();
  logger.info(`fetching all tables: ${query}`);

  try {
    const allTables = await streamAllResults(
      client,
      query,
      { keyspace_name: keyspace },
      (row) => {
        let isThrift: boolean;
        let compression = {};
        if (isV3) {
          isThrift = isThriftV3(row.flags);
          compression = row.compression;
        } else {
          isThrift = isThriftV2(!!row.is_dense, row.comparator);
          compression = JSON.parse(row.compression_parameters);
        }

        return {
          keyspace: row.keyspace_name,
          name: row.name,
          description: row.comment,
          compaction: extractCompaction(client, row),
          isThrift,
          properties: {
            caching: row.caching,
            compression: getCompressionDetails(compression),
            defaultTtl: row.default_time_to_live,
            gcGraceSeconds: row.gc_grace_seconds,
            speculativeRetry: row.speculative_retry,
          },
        };
      },
    );
    return allTables;
  } catch (err) {
    logger.error(
      `Failed to fetch all tables for keyspace: ${keyspace}, due to: ${err.message}`,
    );
    throw err;
  }
}

export async function getTable(
  client: Client,
  keyspace: string,
  table: string,
): Promise<ITableSchema> {
  validateName(keyspace, 'keyspace');
  validateName(table, 'table');

  await client.connect();
  const tableInfo = await client.metadata.getTable(keyspace, table);
  if (!tableInfo) {
    throw new CassandraTableNotFound(keyspace, table);
  }
  logger.info(`retrieved table metadata for: ${tableInfo.name}`);

  const partitionKeys = tableInfo.partitionKeys.map(mapColumn);
  const clusteringKeys = tableInfo.clusteringKeys.map(mapColumn);

  const info: ITableSchema = {
    keyspace,
    name: tableInfo.name,
    clusteringKeys,
    clusteringOrder: tableInfo.clusteringOrder,
    columns: tableInfo.columns.map(mapColumn),
    indexes: tableInfo.indexes,
    partitionKeys,
    primaryKey: [...partitionKeys, ...clusteringKeys],
    isThrift: tableInfo.isCompact,
    properties: {
      bloomFilterFalsePositiveChance: tableInfo.bloomFilterFalsePositiveChance,
      caching: getCachingDetails(tableInfo.caching),
      comment: tableInfo.comment,
      compression: getCompressionDetails(tableInfo.compression as any),
      defaultTtl: tableInfo.defaultTtl,
      gcGraceSeconds: tableInfo.gcGraceSeconds,
      memtableFlushPeriod: tableInfo.memtableFlushPeriod,
      populateCacheOnFlush: tableInfo.populateCacheOnFlush,
      readRepairChance: tableInfo.readRepairChance,
      replicateOnWrite: tableInfo.replicateOnWrite,
      speculativeRetry: tableInfo.speculativeRetry,
      compaction: {
        class: getClassName(tableInfo.compactionClass),
        options: tableInfo.compactionOptions,
      },
    } as ITableProperties,
  };
  return info;
}
