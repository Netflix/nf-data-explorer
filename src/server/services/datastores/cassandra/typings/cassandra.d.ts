import { types } from 'cassandra-driver';
import { IDatastoreConnectParams } from '../../base/datastore'; // relative path needed for client to build

// augment the cassandra-driver module to get types for necessary props.
declare module 'cassandra-driver' {
  export interface ICassandraKeyspace {
    name: string;
    strategy: string;
    strategyOptions: any;
    // other props not included for now...
  }

  export interface ICassandraDatacenter {
    hostLength: number;
    racks: {
      length: number;
      items: {
        [rack: string]: boolean;
      };
    };
  }

  export interface Client {
    controlConnection: {
      host: {
        cassandraVersion: string;
      };
    };
  }

  export namespace metadata {
    interface Metadata {
      datacenters: Array<{
        [datacenter: string]: ICassandraDatacenter;
      }>;
      // FIXME have to override keyspaces to get `strategyOptions` included
      // https://datastax-oss.atlassian.net/browse/NODEJS-558
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      keyspaces: {
        [keyspaceName: string]: ICassandraKeyspace;
      };
    }
  }

  export namespace types {
    function getDataTypeNameByCode(type: {
      code: number;
      info: any;
      options: {
        frozen: boolean;
        reversed: boolean;
      };
    }): string;
  }
}

export interface IClusterInfo {
  version: string;
}

// ##############################################
//   Connections
// ##############################################

export interface ICassandraConnectParams extends IDatastoreConnectParams {
  clusterName: string;
  clusterDescription: string;
  env: string;
  instances: any[];
  region: string;
}

// ##############################################
//   Entities
// ##############################################

export interface IDatacenter {
  name: string;
  racks: any[];
}

export interface IKeyspaceStrategyOptions {
  [key: string]: string;
}

export interface IKeyspace {
  name: string;
  strategy: string;
  strategyOptions: IKeyspaceStrategyOptions;
}

export interface ITableColumn {
  name: string;
  /** The C* column type (e.g. 'bigint', 'varchar, ... ) */
  type: string;
  /** The JS data type (e.g. 'object', 'string', ...) */
  dataType: string;
  options: any;
  needsQuotes: boolean;
}

export interface ITableSchema {
  keyspace: string;
  name: string;
  clusteringKeys: ITableColumn[];
  clusteringOrder: any[];
  columns: ITableColumn[];
  indexes: any;
  isThrift: boolean;
  partitionKeys: ITableColumn[];
  primaryKey: ITableColumn[];
  properties: ITableProperties;
}

export interface ITableSchemaSummary {
  partitionKeySet: Set<string>;
  clusteringKeySet: Set<string>;
  columnTypeMap: Map<string, string>;
}

export interface ITableSummary {
  keyspace: string;
  name: string;
  description: string;
  compaction: any;
  isThrift: boolean;
  properties: {
    caching: string;
    compression: ICompressionOptions;
    defaultTtl: number;
    gcGraceSeconds: number;
  };
}

export interface IClusterSchemaColumn {
  keyspace: string;
  table: string;
  column: string;
  type: string;
  isThrift: boolean;
}

// ##############################################
//   Query Types
// ##############################################

export type CassEncoding = 'ascii' | 'base64' | 'hex' | 'utf-8' | undefined;

export interface IKeyQueryOptions {
  encoding: CassEncoding;
  decodeValues: boolean;
}

export interface IKeyQueryColumnOptions {
  encoding: CassEncoding;
}

export interface IKeyQueryColumnDetails {
  value: any;
  options: IKeyQueryColumnOptions;
}

export interface IKeyQuery {
  primaryKey: {
    [columnName: string]: IKeyQueryColumnDetails;
  };
  options: IKeyQueryOptions;
}

export interface IRowDetails {
  [columnName: string]: IKeyQueryColumnDetails;
}

export interface IKeyResult {
  columns: ITableColumn[];
  rows: Array<{
    [column: string]: any;
  }>;
  pageState: string;
  warnings: any[];
  truncatedColumns: string[];
}

/**
 * Statement execution options.
 */
export interface IStatementExecuteOptions {
  /** Optionally override the default consistency level. */
  consistency?: types.consistencies;
  /** Existing cursor to return additional rows. */
  cursor?: string;
  /** Set to true to ensure queries don't include denied operations. */
  enforceQueryRestrictions: boolean;
  /** When executing a statement that returns rows, includeSchema must be set to true. */
  includeSchema?: boolean;
  /** When querying for rows, keyQueryOptions are required in order to decode rows correctly. */
  keyQueryOptions?: IKeyQueryOptions;
}

export interface IStatementResult {
  columns: ITableColumn[];
  rows: Array<{
    [column: string]: any;
  }>;
  pageState: string;
  warnings: string[];
  schema?: ITableSchema;
  truncatedColumns: string[];
}

// ##############################################
//   Create Table Options
// ##############################################

export interface ICreateTableColumnOptions {
  name: string;
  type: string;
}

export interface ICreateTableClusteringColumnOptions
  extends ICreateTableColumnOptions {
  sort: 'ASC' | 'DESC';
}

export interface ICreateTableOptions {
  keyspace: string;
  table: string;
  partitionColumns: ICreateTableColumnOptions[];
  clusteringColumns: ICreateTableClusteringColumnOptions[];
  staticColumns: ICreateTableColumnOptions[];
  options: ITableProperties;
}

// ##############################################
//   Compaction Options
// ##############################################

export interface ILeveledCompactionOptions {
  type: 'Leveled';
  ssTableSizeInMB: number;
}

export interface ISizeTieredCompactionOptions {
  type: 'SizeTiered';
  max_threshold: number | string;
  min_sstable_size: number | string;
  min_threshold: number | string;
}

export interface ITimeWindowCompactionOptions {
  type: 'TimeWindow';
  compaction_window_size: number;
  compaction_window_unit: string;
}

export interface ICompactionOptions {
  class: string;
  options:
    | ILeveledCompactionOptions
    | ISizeTieredCompactionOptions
    | ITimeWindowCompactionOptions;
}

// ##############################################
//   Compression Options
// ##############################################

export interface ICompressionOptions {
  chunk_length_kb?: number;
  class: string;
  crc_check_chance?: number;
  // memtableFlushPeriod?: number;
  [key: string]: any;
}

// ##############################################
//   Caching Options
// ##############################################

export interface ICachingOptions {
  keys: 'ALL' | 'NONE';
  rows: 'ALL' | 'NONE';
}

export interface IColumnOrdering {
  name: string;
  direction: 'ASC' | 'DESC';
}

export interface ITableProperties {
  bloomFilterFalsePositiveChance?: number;
  caching?: ICachingOptions;
  chunkLengthInKb?: number;
  comment: string;
  compaction?: ICompactionOptions;
  compression?: ICompressionOptions;
  defaultTtl?: number;
  gcGraceSeconds?: number;
  memtableFlushPeriod?: number;
  order?: IColumnOrdering[];
  populateCacheOnFlush?: boolean;
  readRepairChance?: number;
  replicateOnWrite?: boolean;
  speculativeRetry?: string;
}

type TablePropertyKeys = keyof ITableProperties;

export interface ICassandraAccessDef {
  isShared: boolean;
  userKeyspaceNames: Set<string>;
}

export interface IKeyspaceReplication {
  [region: string]: number;
}

export interface IUserDefinedType {
  name: string;
  fields: Array<{
    name: string;
    type: string;
  }>;
}

// ##############################################
//   Metrics
// ##############################################

export interface ICassMetricsKeyspaceUsage {
  keyspaceName: string;
  sizeInBytes: number;
}

export interface ICassMetricsTableUsage {
  estimatedRowCount: number;
  coordinatorHistoricalReads: number[];
  coordinatorTotalReads: number;
  replicaHistoricalReads: number[];
  replicaHistoricalWrites: number[];
  replicaTotalReads: number;
  replicaTotalWrites: number;
  sizeInBytes: number;
  tableName: string;
}

export interface ICassandraFeatureMap {
  allowDrop: boolean;
  allowTruncate: boolean;
  metrics: boolean;
  metricsRequiredForDestructiveOperations: boolean;
  envsAllowingDestructiveOperations: string[];
}

// ##############################################
//   Export Formats
// ##############################################

export type CassandraExportFormat = 'cql' | 'csv';

export type TruncationOption = 'all' | 'binary';
