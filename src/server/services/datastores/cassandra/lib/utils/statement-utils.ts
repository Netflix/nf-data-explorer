import { getWhereClause } from '@/services/datastores/cassandra/lib/utils/schema-utils';
import {
  IKeyQuery,
  IRowDetails,
  ITableColumn,
  ITableSchema,
} from '@/services/datastores/cassandra/typings/cassandra';

/**
 * Generates a CQL INSERT statement from the given input.
 */
export function buildInsertStatement(
  keyspace: string,
  table: string,
  row: IRowDetails,
): string {
  const fieldNames = Object.keys(row).map((field) => `"${field}"`);
  return `
    INSERT INTO "${keyspace}"."${table}"
    (${fieldNames.join(',')})
    VALUES (${fieldNames.map(() => '?').join(',')})`.trim();
}

/**
 * Generates a CQL UPDATE statement from the given input.
 */
export function updateStatement(
  keyspace: string,
  table: string,
  schema: ITableSchema,
  primaryKey: IKeyQuery,
  updateFields: IRowDetails,
): string {
  const whereClauses = getWhereClause(schema, primaryKey);
  const columnMap = schema.columns.reduce(
    (prev, curr) => prev.set(curr.name, curr),
    new Map<string, ITableColumn>(),
  );

  const setStatements = new Array<string>();
  Object.entries(updateFields).forEach(([fieldName, details]) => {
    const column = columnMap.get(fieldName);
    if (column && column.type === 'counter') {
      // only include a set statement for counters of the form `columnName+1`
      if (
        typeof details.value === 'string' &&
        details.value.indexOf(fieldName) >= 0
      ) {
        setStatements.push(`${fieldName}=${details.value}`);
      }
    } else {
      setStatements.push(`${fieldName}=?`);
    }
  });

  return `
    UPDATE "${keyspace}"."${table}"
    SET ${setStatements.join(', ')}
    WHERE ${whereClauses.join(' AND ')}`.trim();
}

/**
 * Generates a CQL DELETE statement from the given input.
 */
export function deleteStatement(
  keyspace: string,
  table: string,
  schema: ITableSchema,
  primaryKey: IKeyQuery,
): string {
  const whereClauses = getWhereClause(schema, primaryKey);
  return `
    DELETE FROM "${keyspace}"."${table}"
    WHERE ${whereClauses.join(' AND ')}`.trim();
}

/**
 * Since difference C* drivers allow case-sensitive keyspaces/tables,
 * quotes must be applied to the keyspace and table names.
 *
 * e.g.
 * ```
 * const result = makeQueryCaseSensitive('select * from keyspaceA.tableB', 'KeySpaceA', 'TABLEb')
 * // select * from "KeySpaceA"."TABLEb"
 * ```
 */
export function makeQueryCaseSensitive(
  query: string,
  keyspace?: string,
  table?: string,
): string {
  return keyspace && table
    ? query.replace(
        /["]?([a-zA-Z0-9_-]*?)["]?\.["]?([a-zA-Z0-9_-]*)["]?/,
        `"${keyspace}"."${table}"`,
      )
    : query;
}

/**
 * Limits a SELECT query to the specified number of results. Note, if a LIMIT is already specified
 * it will be used if it is less than the provided limit value. If the original query LIMIT is higher,
 * it will be rewritten with the provided (lower) value.
 * @param query The user's SELECT query which may or may not include a LIMIT.
 * @param limit The limit to apply.
 * @returns If the query is a SELECT, then a new string is returned with the given limit applied.
 * If the query is not a SELECT (e.g. INSERT or UPDATE), then the original query is returned unmodified.
 */
export function limitSelectQuery(query: string, limit: number): string {
  if (!isSelectQuery(query)) {
    return query;
  }
  const newLimit = `LIMIT ${limit}`;
  const matches = query.match(new RegExp(/^.*\s(limit\s(\d+))\s*$/, 'i'));
  if (matches) {
    const [, limitString, limitValue] = matches;
    if (parseInt(limitValue, 10) <= limit) {
      return query;
    }
    return query.replace(limitString, newLimit);
  } else {
    return `${query} ${newLimit}`;
  }
}

/**
 * Helper function for identifying SELECT queries.
 */
export function isSelectQuery(query: string): boolean {
  return !!query.match(new RegExp(/^\s*select\s+.*$/, 'i'));
}

export function getColumnsFromSelect(query: string): string[] {
  if (!isSelectQuery(query)) {
    return [];
  }
  const matches = query.match(new RegExp(/^\s*select\s+(.+)\s+from/, 'i'));
  if (matches) {
    const [, columns] = matches;
    return columns.split(',').map((columnName) => columnName.trim());
  }
  return [];
}

export function escapeValueString(value: string): string {
  return value.replace(/'/g, "''");
}
