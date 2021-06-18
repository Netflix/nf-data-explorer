import { Alias } from './alias';

export class Select {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static get Builder() {
    // tslint:disable:max-classes-per-file
    class Builder {
      private allColumns = false;
      private limitValue: number | undefined = undefined;
      private columnNames = new Array<string | Alias>();
      private keyspace: string | undefined = undefined;
      private table: string | undefined = undefined;
      private whereColumns: string[] | undefined = undefined;
      private columnsTtlNames = new Array<string>();
      private columnsWriteTimeNames = new Array<string>();

      public from(keyspace: string, table: string): Builder {
        this.keyspace = keyspace;
        this.table = table;
        return this;
      }

      public all(): Builder {
        this.allColumns = true;
        return this;
      }

      /**
       * Columns can be the
       * @param columns The column names or aliases to include in your query.
       */
      public columns(columns: Array<string | Alias>): Builder {
        this.columnNames = columns;
        return this;
      }

      /**
       * Include the column names to fetch TTL information.
       * @param columns The column names to fetch TTL info.
       */
      public columnsTtl(columns: string[]): Builder {
        this.columnsTtlNames = columns;
        return this;
      }

      /**
       * Include the column names to fetch write time information.
       * @param columns The column names to fetch write time.
       */
      public columnsWriteTime(columns: string[]): Builder {
        this.columnsWriteTimeNames = columns;
        return this;
      }

      public where(columns: string[]): Builder {
        this.whereColumns = columns;
        return this;
      }

      public limit(n: number | undefined): Builder {
        if (n !== undefined) {
          this.limitValue = n;
        }
        return this;
      }

      public build(): string {
        const statementPieces = ['SELECT'];

        // include columns
        if (this.allColumns) {
          statementPieces.push('*');
        } else {
          statementPieces.push(
            [
              ...this.columnNames.map((name) => {
                if (name instanceof Alias) {
                  return `"${name.columnName}" as "${name.alias}"`;
                } else {
                  return `"${name}"`;
                }
              }),
              ...this.columnsTtlNames.map((column) => `TTL("${column}")`),
              ...this.columnsWriteTimeNames.map(
                (column) => `writetime("${column}")`,
              ),
            ].join(', '),
          );
        }

        // FROM
        statementPieces.push(`FROM "${this.keyspace}"."${this.table}"`);

        // add where clause
        if (this.whereColumns !== undefined && this.whereColumns.length > 0) {
          if (this.whereColumns.some((column) => !column)) {
            throw new Error(
              `All columns in WHERE clause must be valid strings. Received: ${JSON.stringify(
                this.whereColumns,
              )}`,
            );
          }
          statementPieces.push(
            'WHERE',
            this.whereColumns.map((column) => `"${column}"=?`).join(' AND '),
          );
        }

        // LIMIT
        if (this.limitValue !== undefined) {
          statementPieces.push(`LIMIT ${this.limitValue}`);
        }

        return statementPieces.join(' ');
      }
    }
    return Builder;
  }
}
