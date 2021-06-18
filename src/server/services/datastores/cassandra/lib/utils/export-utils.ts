import {
  ITableColumn,
  ITableSchema,
  CassEncoding,
} from '@/services/datastores/cassandra/typings/cassandra';
import CassandraExplorer from '../CassandraExplorer';
import {
  isCollectionType,
  getCollectionRowValueAsString,
} from '@/shared/cassandra/collection-utils';

export function generateCqlStatements(
  schema: ITableSchema,
  rows: Array<{
    [column: string]: any;
  }>,
  cassandraApi: CassandraExplorer,
  encoding: CassEncoding,
): string[] {
  return rows.map((row) => {
    const rowWithoutSpecialFields = Object.entries(row).reduce((prev, curr) => {
      const [columnName, value] = curr;
      // ignore fields like `TTL(column)` and `writetime(column)`
      if (columnName.indexOf('(') === -1) {
        prev[columnName] = value;
      }
      return prev;
    }, {});
    return cassandraApi.generateInsertStatement(
      schema,
      rowWithoutSpecialFields,
      encoding,
    );
  });
}

export function generateCsv(
  schema: ITableSchema,
  columns: ITableColumn[],
  rows: Array<{
    [column: string]: any;
  }>,
  columnDelimiter = '\t',
  lineDelimiter = '\n',
): string {
  const columnMap = new Map<string, ITableColumn>();
  schema.columns.map((col) => columnMap.set(col.name, col));
  const sortedColumns = sortTableColumns(schema, columns);
  const columnNames = sortedColumns.map((column) => column.name);

  let tsv = `${columnNames.join(columnDelimiter)}${lineDelimiter}`;
  rows.forEach((row) => {
    const cell = columnNames
      .map((columnName) => {
        const { type } = columnMap.get(columnName) as ITableColumn;
        const value = row[columnName];
        if (value === null) {
          return '';
        } else if (isCollectionType(type)) {
          return getCollectionRowValueAsString(type, value);
        } else if (type === 'timestamp' && value) {
          return (value as Date).toISOString();
        }
        return value;
      })
      .join(columnDelimiter);
    tsv += `${cell}${lineDelimiter}`;
  });
  return tsv;
}

function sortTableColumns(schema: ITableSchema, columns: ITableColumn[]) {
  const partitionKeyMap = new Map();
  const clusteringKeyMap = new Map();

  schema.partitionKeys.forEach((key, index) =>
    partitionKeyMap.set(key.name, index),
  );
  schema.clusteringKeys.forEach((key, index) =>
    clusteringKeyMap.set(key.name, index),
  );
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
