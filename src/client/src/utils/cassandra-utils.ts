import { IMultiValidationResult } from '@/typings/validation';
import {
  IKeyQuery,
  ITableColumn,
  ITableSchema,
  ITableSchemaSummary,
} from '@cassandratypes/cassandra';
import format from 'date-fns/format';
import numeral from 'numeral';
import { difference } from './set-utils';

export function sortTableColumns(schema: ITableSchema): ITableColumn[] {
  const partitionKeyMap = new Map();
  const clusteringKeyMap = new Map();

  schema.partitionKeys.forEach((key, index) =>
    partitionKeyMap.set(key.name, index),
  );
  schema.clusteringKeys.forEach((key, index) =>
    clusteringKeyMap.set(key.name, index),
  );

  const columns: ITableColumn[] = JSON.parse(JSON.stringify(schema.columns));

  const sortedColumns = columns.sort((a, b) => {
    const aIsPartitionKey = partitionKeyMap.has(a.name);
    const bIsPartitionKey = partitionKeyMap.has(b.name);

    const aIsClusteringKey = clusteringKeyMap.has(a.name);
    const bIsClusteringKey = clusteringKeyMap.has(b.name);

    if (aIsPartitionKey && !bIsPartitionKey) {
      return -1;
    } else if (!aIsPartitionKey && bIsPartitionKey) {
      return 1;
    } else if (aIsPartitionKey && bIsPartitionKey) {
      return partitionKeyMap.get(a.name) - partitionKeyMap.get(b.name);
    }

    if (aIsClusteringKey && !bIsClusteringKey) {
      return -1;
    } else if (!aIsClusteringKey && bIsClusteringKey) {
      return 1;
    } else if (aIsClusteringKey && bIsClusteringKey) {
      return clusteringKeyMap.get(a.name) - clusteringKeyMap.get(b.name);
    }

    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    }
    return 0;
  });

  return sortedColumns;
}

function buildQueries(baseQuery: string, bindings: string[], suffix?: string) {
  const queries = new Array<string>();
  for (let i = 0; i < bindings.length; i++) {
    let query = `${baseQuery} WHERE\n\t`;
    query = query + bindings.slice(0, i + 1).join(' AND\n\t');
    queries.push(suffix ? `${query} ${suffix}` : query);
  }
  return queries;
}

export function generateSampleQueries(
  keyspace: string,
  table: string,
  partitionKeys: string[],
  clusteringColumns: string[],
): string[] {
  const buildVariables = (key: string) => `${key} = :${key.toLowerCase()}`;
  const partitionBindings = partitionKeys.map(buildVariables);
  const clusteringBindings = clusteringColumns.map(buildVariables);

  const baseQuery = `SELECT * FROM "${keyspace}"."${table}"`;
  const suffix = 'LIMIT 1';

  let sampleQueries = [`${baseQuery} ${suffix}`];
  sampleQueries = sampleQueries.concat(
    buildQueries(baseQuery, partitionBindings, suffix),
  );
  if (clusteringBindings.length > 0) {
    sampleQueries = sampleQueries.concat(
      buildQueries(
        baseQuery,
        partitionBindings.concat(clusteringBindings),
        suffix,
      ),
    );
  }
  return sampleQueries;
}

export function formatTtl(ttlInSeconds: number): string {
  if (ttlInSeconds === 0) {
    return '0 (TTL disabled)';
  }
  const value = format(Date.now() + ttlInSeconds * 1000, 'MM/dd/yyyy HH:mm:ss');
  return `${numeral(ttlInSeconds).format()} seconds (${value})`;
}

export function getPrimaryKeyColumns(schema: ITableSchema): Set<string> {
  return new Set([
    ...schema.partitionKeys.map((key) => key.name),
    ...schema.clusteringKeys.map((key) => key.name),
  ]);
}

export function getEditableColumnNames(schema: ITableSchema): ITableColumn[] {
  const primaryKeyColumns = getPrimaryKeyColumns(schema);
  return schema.columns.filter((column) => !primaryKeyColumns.has(column.name));
}

export function parseCreateStatement(
  createStatement: string,
): {
  keyspaceName: string | undefined;
  tableName: string | undefined;
} {
  const re = new RegExp(
    /^\s*CREATE\s*TABLE\s*(?:(?:"(\w+)")|(\w+))\.(?:(?:"(\w+)")|(\w+))\s+.*$/,
    'gim',
  );
  const matches = re.exec(createStatement);
  if (matches) {
    const [
      ,
      quotedKeyspaceName,
      keyspaceName,
      quotedTableName,
      tableName,
    ] = matches;
    return {
      keyspaceName: quotedKeyspaceName || keyspaceName,
      tableName: quotedTableName || tableName,
    };
  }
  return {
    keyspaceName: undefined,
    tableName: undefined,
  };
}

/**
 * Checks to see if the given key is a complete primary key for the given schema.
 * @param schema The current table schema.
 * @param key The set of key value pairs that make up the primary key.
 */
export function validateCompletePrimaryKey(
  schema: ITableSchema,
  key: IKeyQuery,
): Set<string> {
  const primaryKeySet = getPrimaryKeyColumns(schema);
  const { primaryKey } = key;
  const keySet = Object.entries(primaryKey).reduce(
    (set, [columnName, details]) => {
      if (details.value !== undefined) {
        set.add(columnName);
      }
      return set;
    },
    new Set<string>(),
  );
  return difference(primaryKeySet, keySet);
}

/**
 * Poorly designed schemas cannot be edited.
 * @param schema The current table schema.
 */
export function validateRetrievableSchema(
  schema: ITableSchema,
): IMultiValidationResult {
  const messages = new Array<string>();
  const { primaryKey } = schema;
  if (primaryKey.some((col) => col.type === 'blob')) {
    messages.push('Primary key contains blob types');
  }
  return {
    isValid: messages.length === 0,
    messages,
  };
}

export function validateUnencodedBlobPrimaryKey(
  schema: ITableSchema,
  key: IKeyQuery,
): boolean {
  const { primaryKey } = schema;
  const blobKeySet = primaryKey.reduce(
    (set, { name, type }) => (type.includes('blob') ? set.add(name) : set),
    new Set<string>(),
  );
  return blobKeySet.size === 0 || key.options.encoding !== undefined;
}

export function getSchemaSummary(schema: ITableSchema): ITableSchemaSummary {
  const { partitionKeys, clusteringKeys, columns } = schema;
  return {
    partitionKeySet: new Set(partitionKeys.map((item) => item.name)),
    clusteringKeySet: new Set(clusteringKeys.map((item) => item.name)),
    columnTypeMap: columns.reduce((prev, curr) => {
      prev.set(curr.name, curr.dataType);
      return prev;
    }, new Map<string, string>()),
  };
}
