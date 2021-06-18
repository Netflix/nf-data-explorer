import ClusterSchema from '@/models/cassandra/ClusterSchema';
import QueryTokenizer from './CassQueryTokenizer';

interface IBaseValidationError {
  message: string;
}

interface ISchemaValidationError extends IBaseValidationError {
  type: 'schema';
  keyspace?: string;
}

interface ISyntaxValidationError extends IBaseValidationError {
  type: 'syntax';
  action?: string;
}

export type ValidationError = ISchemaValidationError | ISyntaxValidationError;

export default class QueryValidator {
  private schema: ClusterSchema | undefined;
  constructor(
    readonly queryTokenizer: QueryTokenizer,
    schema: ClusterSchema | undefined,
  ) {
    this.schema = schema;
  }

  public updateSchema(schema: ClusterSchema | undefined) {
    this.schema = schema;
  }

  public validate(): ValidationError[] {
    const errors = new Array<ValidationError>();

    if (!this.queryTokenizer.containsActionToken()) {
      return errors;
    }

    const keyspace = this.queryTokenizer.getKeyspace();
    const table = this.queryTokenizer.getTable();
    if (!keyspace || !table) {
      this.addSyntaxError(
        errors,
        'Keyspace and table names must be fully qualified (e.g. my_keyspace.my_table)',
      );
    } else if (this.schema && !this.schema.hasKeyspace(keyspace)) {
      this.addSchemaError(
        errors,
        `Keyspace ${keyspace} could not be found.`,
        undefined,
      );
    } else if (this.schema && !this.schema.hasTable(keyspace, table)) {
      this.addSchemaError(
        errors,
        `Table ${table} could not be found.`,
        keyspace,
      );
    } else if (this.queryTokenizer.isInsertStatement()) {
      this.validateInsert(errors, keyspace, table);
    } else if (this.queryTokenizer.isUpdateStatement()) {
      this.validateUpdate(errors, keyspace, table);
    } else if (this.queryTokenizer.isSelectStatement()) {
      this.validateSelect(errors, keyspace, table);
    }
    return errors;
  }

  private validateInsert(
    messages: ValidationError[],
    keyspace: string,
    table: string,
  ) {
    const ACTION = 'INSERT';
    const columnTokens = this.queryTokenizer.filterTokens('insert.column_name');
    const valueTokens = this.queryTokenizer.filterTokens('insert.column_value');

    if (
      !this.checkColumnTokens(messages, 'insert.column_name', keyspace, table)
    ) {
      return;
    } else if (
      !this.checkPrimaryKey(messages, 'insert.column_name', keyspace, table)
    ) {
      return;
    } else if (columnTokens.length !== valueTokens.length) {
      this.addSyntaxError(
        messages,
        'Mismatched number of columns and values',
        ACTION,
      );
    }
    // TODO more we can do here
  }

  private validateUpdate(
    messages: ValidationError[],
    keyspace: string,
    table: string,
  ) {
    const ACTION = 'UPDATE';
    const tokenizer = this.queryTokenizer;
    if (
      !this.checkPrimaryKey(
        messages,
        'update.statement.column_name',
        keyspace,
        table,
      )
    ) {
      return;
    } else if (!tokenizer.findTokenWithValue('keyword', 'where')) {
      this.addSyntaxError(messages, 'Missing WHERE clause', ACTION);
    }
    // TODO more we can do here
  }

  private validateSelect(
    errors: ValidationError[],
    keyspace: string,
    table: string,
  ) {
    this.checkColumnTokens(errors, 'select.statement.column', keyspace, table);
    this.checkColumnTokens(
      errors,
      'where.statement.column_name',
      keyspace,
      table,
    );
    // TODO more we can do here
  }

  private checkPrimaryKey(
    errors: ValidationError[],
    token: string,
    keyspace: string,
    table: string,
  ) {
    if (!this.schema) {
      return;
    }

    const queryColumnSet = new Set(
      this.queryTokenizer.filterTokens(token).map((colToken) => colToken.value),
    );

    const primaryKeyColumns = this.schema
      .getColumns(keyspace, table)
      .filter((col) => col.isPartitionKey || col.isClusteringKey);

    return primaryKeyColumns.every((col) => {
      if (!queryColumnSet.has(col.name)) {
        this.addSchemaError(
          errors,
          `Missing mandatory primary key part "${col.name}"`,
          keyspace,
        );
        return false;
      }
      return true;
    });
  }

  private checkColumnTokens(
    errors: ValidationError[],
    token: string,
    keyspace: string,
    table: string,
  ) {
    if (!this.schema) {
      return;
    }
    const tokens = this.queryTokenizer.filterTokens(token);
    const columnNameSet = new Set(this.schema.getColumnNames(keyspace, table));
    return tokens.every((columnToken) => {
      const { value: columnName } = columnToken;
      if (!columnNameSet.has(columnName)) {
        errors.push({
          type: 'schema',
          message: `Could not find column "${columnName}" on ${keyspace}.${table}`,
          keyspace,
        });
        return false;
      }
      return true;
    });
  }

  private addSchemaError(
    errors: ValidationError[],
    message: string,
    keyspace: string | undefined,
  ) {
    errors.push({
      type: 'schema',
      message,
      keyspace,
    });
  }

  private addSyntaxError(
    errors: ValidationError[],
    message: string,
    action?: string,
  ) {
    errors.push({
      type: 'syntax',
      message,
      action,
    });
  }
}
