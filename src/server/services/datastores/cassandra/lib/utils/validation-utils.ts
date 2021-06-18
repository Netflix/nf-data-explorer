import {
  CassandraPrimaryKeyMissing,
  CassandraStatementNotAllowed,
} from '@/services/datastores/cassandra/lib/errors';
import { getRestrictedQueries } from '@/services/datastores/cassandra/lib/restricted-queries';
import {
  IKeyQuery,
  ITableSchema,
} from '@/services/datastores/cassandra/typings/cassandra';

export function validateName(
  keyspaceOrTableName: string,
  objectType: string,
): void {
  const INVALID_CHARS = /[^a-zA-Z0-9_]/;
  if (keyspaceOrTableName.match(INVALID_CHARS)) {
    throw new Error(`invalid ${objectType} name ${keyspaceOrTableName}`);
  }
}

/**
 * Helper method for santizing a free form query and making sure it doesn't contain any illegal statements.
 * This method does not return anything, but simply throws a CassandraStatementNotAllowed Error if the query
 * contains illegal statements.
 * @param  query The free form query.
 * @throws CassandraStatementNotAllowed
 */
export function checkQueryRestrictions(query: string): void {
  const illegalStatements = new Array<string>();
  getRestrictedQueries().forEach((forbiddenQuery) => {
    const re = new RegExp(forbiddenQuery.regex, 'gi');
    if (query.match(re)) {
      illegalStatements.push(forbiddenQuery.message);
    }
  });

  if (illegalStatements.length > 0) {
    throw new CassandraStatementNotAllowed(query, illegalStatements[0]);
  }
}

/**
 * Helper method for checking if a given primary key is completely specified (partition key
 * and clustering keys).
 * @param schema The schema to validate against.
 * @param keyQuery The primary key components.
 */
export function checkCompletePrimaryKey(
  schema: ITableSchema,
  keyQuery:
    | IKeyQuery
    | {
        [column: string]: any;
      },
): void {
  let key: {
    [column: string]: any;
  };
  if (keyQuery.primaryKey && keyQuery.options) {
    key = Object.entries((keyQuery as IKeyQuery).primaryKey).reduce(
      (prev, [name, details]) => {
        prev[name] = details.value;
        return prev;
      },
      {} as { [column: string]: any },
    );
  } else {
    key = keyQuery;
  }

  if (!isCompletePrimaryKey(schema, key)) {
    throw new CassandraPrimaryKeyMissing(schema.keyspace, schema.name);
  }
}

/**
 * Helper method for checking if the given primary key fully specifies all partition and clustering keys.
 * @param   schema      The table schema to test against.
 * @param   keyQuery  The primary key that should identify a single record.
 * @return  True if every key is specified. False otherwise.
 */
function isCompletePrimaryKey(
  schema: ITableSchema,
  primaryKey: {
    [column: string]: any;
  },
): boolean {
  const { primaryKey: pkColumns } = schema;
  const requiredFields = pkColumns.map((col) => col.name);
  const primaryKeySet = new Set(Object.keys(primaryKey));
  return requiredFields.every((key) => primaryKeySet.has(key));
}
