import { types } from 'cassandra-driver';
import { IKeyQueryOptions, ITableSchema } from '../../typings/cassandra';
import { getBlobColumnNames } from './schema-utils';

/**
 * Maps
 * @param row The result row returned by the driver.
 * @param columnNames The column names to include in the results.
 * @param schema The table schema.
 * @param options The retrieval options.
 */
export function mapResultRow(
  row: types.Row,
  columnNames: string[],
  schema: ITableSchema,
  options: IKeyQueryOptions,
): {
  [columnName: string]: any;
} {
  const { encoding, decodeValues } = options;
  const blobColumns = getBlobColumnNames(schema, false);
  const blobPKs = getBlobColumnNames(schema, true);

  return columnNames.reduce(
    (prev, columnName) => {
      let rowValue = row.get(columnName);
      if (blobColumns.has(columnName)) {
        if (!encoding || (!blobPKs.has(columnName) && !decodeValues)) {
          return prev;
        }
        if (rowValue) {
          const stringBuffer = (rowValue as Buffer).toString(encoding);
          rowValue = encoding === 'hex' ? `0x${stringBuffer}` : stringBuffer;
        } else {
          rowValue = '';
        }
      }
      prev[columnName] = rowValue;
      return prev;
    },
    {} as {
      [columnName: string]: any;
    },
  );
}
