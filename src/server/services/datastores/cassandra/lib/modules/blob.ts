import { Client } from 'cassandra-driver';
import {
  CassandraColumnNameNotFound,
  CassandraIncorrectColumnType,
  CassandraPrimaryKeyMissing,
} from '../errors';
import { getWhereClause } from '../utils/schema-utils';
import { getTable } from './tables';
import { IKeyQuery } from '../../typings/cassandra';

export async function getBinaryValue(
  client: Client,
  keyspace: string,
  table: string,
  keyQuery: IKeyQuery,
  binaryColumnName: string,
): Promise<Buffer | null> {
  const schema = await getTable(client, keyspace, table);

  if (!keyQuery || Object.keys(keyQuery.primaryKey).length === 0) {
    throw new CassandraPrimaryKeyMissing(keyspace, table);
  }
  if (!binaryColumnName) {
    throw new Error('Blob column name is required');
  }

  const column = schema.columns.find(
    (col) => col.name.toLowerCase() === binaryColumnName.toLowerCase(),
  );
  if (!column) {
    throw new CassandraColumnNameNotFound(keyspace, table, binaryColumnName);
  }
  if (column.type !== 'blob') {
    throw new CassandraIncorrectColumnType(
      keyspace,
      table,
      binaryColumnName,
      column.type,
      'blob',
    );
  }

  const whereClauses = getWhereClause(schema, keyQuery);
  const query = `
            SELECT "${binaryColumnName}"
            FROM "${keyspace}"."${table}"
            WHERE ${whereClauses.join(' AND ')}`;

  const { rows } = await client.execute(query);
  if (rows.length === 0) {
    throw new Error(
      'Could not find a matching record. This record may have already been deleted.',
    );
  }
  if (rows.length > 1) {
    throw new Error(
      'Expected a single result. This is likely to occur if an invalid primary key was specified',
    );
  }

  const row = rows[0];
  return row[binaryColumnName];
}
