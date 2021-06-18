# Overview

The schema-builder package fills a gap in the current cassandra driver which doesn't provide schema creation support.

I've attempted to port some of the Java schemabuilder interfaces in anticipation of future support in the cassandra
driver. We may be able to submit a PR back to them for this support.

## Examples

### Simple create statement 

```
const statement = SchemaBuilder.createTable('school', 'students');
    .addPartitionColumn('user', 'varchar')
    .addClusteringColumn('school', 'varchar')
    .addStaticColumn('grade', 'float');
   
console.log(statement.getQueryString());
```

### Create with options

```
const statement = SchemaBuilder.createTable('school', 'students');
    .addPartitionColumn('user', 'varchar')
    .addClusteringColumn('school', 'varchar')
    .addStaticColumn('grade', 'float')
    .withOptions()
    .comment('description of user table')
    .compactStorage()
    .clusteringOrder('school', 'DESC');
   
console.log(statement.getQueryString());
```

### Complex example

```
const statement = SchemaBuilder.createTable(keyspace, tableName)
    .addPartitionColumn('account', 'int')
    .addClusteringColumn('firstName', 'varchar')
    .addClusteringColumn('lastName', 'varchar')
    .addStaticColumn('address', 'varchar')
    .addStaticColumn('state', 'varchar')
    .withOptions()
    .compactionOptions(SchemaBuilder.leveledStrategy())
    .gcGraceSeconds(8000)
    .bloomFilterFPChance(0.01)
    .defaultTtl(100)
    .clusteringOrder('firstName', 'DESC');
    
console.log(statement.getQueryString());
```
