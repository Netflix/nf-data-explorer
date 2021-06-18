export interface IQueryHelp {
  keyword: string;
  description: string;
  syntax: string;
}

export const supportedQueries: IQueryHelp[] = [
  {
    keyword: 'SELECT',
    description: 'Queries for one or more rows from a single table.',
    syntax: `SELECT * | select_clause | DISTINCT partition_key
FROM keyspace_name.table_name
[WHERE partition_key_clause
(AND clustering_column_filters)
(AND static_column_filters)]
[ORDER BY column_name (ASC|DESC)]
[LIMIT N]
[ALLOW FILTERING]`,
  },
  {
    keyword: 'INSERT',
    description:
      'Insert a new row of data or updates an existing row use the primary key (partition key plus any clustering columns).',
    syntax: `INSERT INTO keyspace_name.table_name (column_list)
VALUES (column_values)
[IF NOT EXISTS]
[USING TTL seconds | TIMESTAMP epoch_in_microseconds]`,
  },
  {
    keyword: 'UPDATE',
    description: 'Update column values in a row.',
    syntax: `UPDATE keyspace_name.table_name
[USING TTL time_value | USING TIMESTAMP timestamp_value]
SET assignment [, assignment] . . .
WHERE row_specification
[IF EXISTS | IF NOT EXISTS | IF condition [AND condition] . . .] ;`,
  },
];
