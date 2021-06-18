import CreateTableOptions from '@/services/datastores/cassandra/lib/modules/schema-builder/CreateTableOptions';
import SchemaStatement from '@/services/datastores/cassandra/lib/modules/schema-builder/SchemaStatement';
import { Version } from '@/services/datastores/cassandra/lib/modules/schema-builder/Version';
import { CassandraTableSchemaValidationError } from '../../errors/CassandraTableSchemaValidationError';

interface IColumn {
  name: string;
  type: string;
}

/**
 * Primary class for creating a new Table.
 */
export default class Create extends SchemaStatement {
  private static _validatePrimaryKey(columnName: string, columnType: string) {
    if (!columnName || columnName.length === 0) {
      throw new CassandraTableSchemaValidationError(
        columnName,
        columnType,
        'Primary key name must be non-empty string.',
        'Column name is required.',
      );
    }
    if (!columnType || columnType.length === 0) {
      throw new CassandraTableSchemaValidationError(
        columnName,
        columnType,
        `Primary key component "${columnName}" must specify a valid C* data type.`,
        `Please check the data type of column ${columnName}`,
      );
    }
    if (columnType.match(/(list|map|set|tuple)<.*>/gi)) {
      throw new CassandraTableSchemaValidationError(
        columnName,
        columnType,
        `Invalid collection type for primary key component "${columnName}".`,
        'The primary key cannot contain any collection types.',
      );
    }
  }

  public clusteringColumns: IColumn[];
  private partitionColumns: IColumn[];
  private staticColumns: IColumn[];

  constructor(
    readonly keyspaceName: string,
    readonly tableName: string,
    readonly version: Version,
  ) {
    super();
    if (!keyspaceName || keyspaceName.length === 0) {
      throw new Error('keyspaceName is required');
    }
    if (!tableName || tableName.length === 0) {
      throw new Error('tableName is required');
    }
    if (!version || !(version instanceof Version)) {
      throw new Error('version is required and must be an instance of Version');
    }
    this.partitionColumns = [];
    this.clusteringColumns = [];
    this.staticColumns = [];
  }

  public addPartitionColumn(columnName: string, columnType: string): Create {
    Create._validatePrimaryKey(columnName, columnType);
    this.partitionColumns.push({
      name: columnName,
      type: columnType,
    });
    return this;
  }

  public addClusteringColumn(columnName: string, columnType: string): Create {
    Create._validatePrimaryKey(columnName, columnType);
    this.clusteringColumns.push({
      name: columnName,
      type: columnType,
    });
    return this;
  }

  public addStaticColumn(columnName: string, columnType: string): Create {
    this.staticColumns.push({
      name: columnName,
      type: columnType,
    });
    return this;
  }

  public withOptions(): CreateTableOptions {
    return new CreateTableOptions(this, this.version);
  }

  public getQueryString(): string {
    if (this.partitionColumns.length === 0) {
      throw new Error(
        `There should be at least one partition key defined for the table: ${this.tableName}`,
      );
    }

    let stmt = this.STATEMENT_START;
    stmt += `CREATE TABLE "${this.keyspaceName}"."${this.tableName}"`;
    stmt += ' (';
    stmt += this.COLUMN_FORMAT;

    const allColumns = new Array<IColumn>().concat(
      this.partitionColumns,
      this.clusteringColumns,
      this.staticColumns,
    );
    const partitionKeyNames = this.partitionColumns.map((col) => col.name);
    const clusteringKeyNames = this.clusteringColumns.map((col) => col.name);

    const partitionKeyPart =
      partitionKeyNames.length === 1
        ? partitionKeyNames[0]
        : `(${partitionKeyNames.join(', ')})`;
    const primaryKeyPart = [partitionKeyPart]
      .concat(clusteringKeyNames)
      .join(', ');

    // add all the column definitions
    stmt += this._buildColumns(allColumns);

    // append the primary key
    stmt += `,${this.COLUMN_FORMAT}`;
    stmt += `PRIMARY KEY (${primaryKeyPart})`;

    stmt += this.STATEMENT_START;
    stmt += ')';

    return stmt;
  }

  private _buildColumns(columns: IColumn[]) {
    return columns
      .map((entry) => `${entry.name} ${entry.type}`)
      .join(`,${this.COLUMN_FORMAT}`);
  }
}
