export enum Routes {
  Datastores = 'Datastores',
  Admin = 'Admin',

  // cassandra
  CassandraClusters = 'CassandraClusters',
  CassandraCluster = 'CassandraCluster',
  CassandraKeyspaces = 'CassandraKeyspaces',
  CassandraKeyspace = 'CassandraKeyspace',
  CassandraKeyspaceTables = 'CassandraKeyspaceTables',
  CassandraKeyspaceUDTs = 'CassandraKeyspaceUDTs',
  CassandraKeyspaceCreate = 'CassandraKeyspaceCreate',
  CassandraTableCreate = 'CassandraTableCreate',
  CassandraTableCreateAdvanced = 'CassandraTableCreateAdvanced',
  CassandraTable = 'CassandraTable',

  CassandraQuery = 'CassandraQuery',
  CassandraQueryDataCreate = 'CassandraQueryDataCreate',
  CassandraQueryDataEdit = 'CassandraQueryDataEdit',

  // table detail routes
  CassandraTableData = 'CassandraTableData',
  CassandraTableColumns = 'CassandraTableColumns',
  CassandraTableProperties = 'CassandraTableProperties',
  CassandraTableSamples = 'CassandraTableSamples',
  CassandraTableActivity = 'CassandraTableActivity',

  CassandraTableDataCreate = 'CassandraTableDataCreate',
  CassandraTableDataEdit = 'CassandraTableDataEdit',
  CassandraTableDrop = 'CassandraTableDrop',
  CassandraTableTruncate = 'CassandraTableTruncate',

  // dynomite
  DynomiteClusters = 'DynomiteClusters',
  DynomiteCluster = 'DynomiteCluster',
  DynomiteEmptyKeyView = 'DynomiteEmptyKeyView',
  DynomiteEditKey = 'DynomiteEditKey',
  DynomiteCreateKey = 'DynomiteCreateKey',
}
