import {
  IKeyQuery,
  IKeyQueryColumnDetails,
  IKeyQueryOptions,
  ITableSchema,
  IRowDetails,
  ITableColumn,
} from '@cassandratypes/cassandra';
import { getPrimaryKeyColumns } from './cassandra-utils';

function buildColumnDetails(
  columns: ITableColumn[],
  row: {
    [column: string]: any;
  },
  options: IKeyQueryOptions,
) {
  const metadataFields = ['writetime', 'ttl'];
  return columns.reduce(
    (prev, { name, type }) => {
      prev[name] = {
        value: row[name],
        options: {
          encoding: type === 'blob' ? options.encoding : undefined, // use the retrieval option
        },
      };

      metadataFields.forEach((field) => {
        const metadataKey = `${field}(${name})`;
        if (row[metadataKey]) {
          prev[metadataKey] = {
            value: row[metadataKey],
            options: {
              encoding: undefined,
            },
          };
        }
      });
      return prev;
    },
    {} as {
      [columnName: string]: IKeyQueryColumnDetails;
    },
  );
}

export function getKeyQuery(
  schema: ITableSchema,
  row: any,
  options: IKeyQueryOptions,
): IKeyQuery {
  const { primaryKey: pkColumns } = schema;
  const primaryKey = buildColumnDetails(pkColumns, row, options);
  return {
    primaryKey,
    options,
  };
}

/**
 * Helper method for getting the row fields without the primary key components
 * (row minus the partition and clustering columns).
 * @param schema The table schema.
 * @param row The row values.
 */
export function getRowWithoutKey(schema: ITableSchema, row: any) {
  const primaryKeyNames = getPrimaryKeyColumns(schema);
  return Object.entries(row)
    .filter(([columnName]) => !primaryKeyNames.has(columnName))
    .reduce(
      (prev, [columnName, columnValue]) => ({
        ...prev,
        [columnName]: columnValue,
      }),
      {},
    );
}

/**
 *
 * @param schema Table schema.
 * @param row The current row values.
 * @param queryOptions The retrieval options used to query the results.
 * @param include Which columns should be included.
 */
export function getRowDetails(
  schema: ITableSchema,
  row: {
    [column: string]: any;
  },
  queryOptions: IKeyQueryOptions,
  include: 'primary-key' | 'values' | 'all',
): IRowDetails {
  const { columns, primaryKey } = schema;

  let includedColumns: ITableColumn[];
  if (include === 'all') {
    includedColumns = schema.columns;
  } else {
    const pkColumnSet = new Set(primaryKey.map((col) => col.name));
    switch (include) {
      case 'primary-key':
        includedColumns = primaryKey;
        break;
      case 'values':
        includedColumns = columns.filter((col) => !pkColumnSet.has(col.name));
        break;
      default:
        includedColumns = [];
        break;
    }
  }
  return buildColumnDetails(includedColumns, row, queryOptions);
}

export function getKeyQueryFromRowDetails(
  schema: ITableSchema,
  row: IRowDetails,
  options: IKeyQueryOptions,
): IKeyQuery {
  const primaryKeyNames = getPrimaryKeyColumns(schema);
  const primaryKey = Object.entries(row).reduce(
    (pk, [columnName, details]) => {
      if (primaryKeyNames.has(columnName)) {
        pk[columnName] = details;
      }
      return pk;
    },
    {} as {
      [columnName: string]: IKeyQueryColumnDetails;
    },
  );
  return {
    primaryKey,
    options,
  };
}
