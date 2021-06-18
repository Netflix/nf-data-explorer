import {
  IKeyResult,
  IStatementResult,
  ITableColumn,
  TruncationOption,
  ITableSchema,
} from '../../typings/cassandra';

const availableTruncationOptions: Array<TruncationOption> = ['all', 'binary'];

export function truncateResults(
  keys: IKeyResult | IStatementResult,
  schema: ITableSchema,
  option: TruncationOption,
): IKeyResult | IStatementResult {
  if (!availableTruncationOptions.includes(option)) {
    throw new Error(`Unexpected truncation option: ${option}`);
  }

  const { columns, rows } = keys;
  const columnMap = columns.reduce(
    (map, col) => map.set(col.name, col),
    new Map<string, ITableColumn>(),
  );

  const { partitionKeys, clusteringKeys } = schema;
  const primaryKey = new Set(
    [...partitionKeys, ...clusteringKeys].map((col) => col.name),
  );

  const MAX_STRING_SIZE = 150;
  const truncatedColumns = new Set<string>();
  const returnedRows = rows.map((row) =>
    Object.entries(row).reduce(
      (curr, [columnName, value]) => {
        const column = columnMap.get(columnName);
        if (column) {
          const columnType = column.type;
          const includedType =
            option === 'all' ||
            (option === 'binary' && columnType.includes('blob'));

          const tooLong =
            includedType &&
            typeof value === 'string' &&
            value.length > MAX_STRING_SIZE;
          if (tooLong && !primaryKey.has(columnName)) {
            truncatedColumns.add(columnName);
            curr[columnName] = value.substr(0, MAX_STRING_SIZE) + '...';
          } else {
            curr[columnName] = value;
          }
        }
        return curr;
      },
      {} as {
        [columnName: string]: any;
      },
    ),
  );
  return {
    ...keys,
    rows: returnedRows,
    truncatedColumns: Array.from(truncatedColumns),
  };
}
