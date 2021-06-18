import {
  getCollectionRowValueAsString,
  isCollectionType,
} from '@/shared/cassandra/collection-utils';
import {
  CassEncoding,
  ITableColumn,
  ITableSchema,
} from '../../../typings/cassandra';
import { checkCompletePrimaryKey } from '../../utils/validation-utils';
import { escapeValueString } from '../../utils/statement-utils';

export class Insert {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static get Builder() {
    // tslint:disable:max-classes-per-file
    class Builder {
      private schema: ITableSchema | undefined = undefined;
      private values = {};
      private ttlValue: number | undefined;
      private encodingValue: CassEncoding;

      public into(schema: ITableSchema): Builder {
        this.schema = schema;
        return this;
      }

      public value(columnName: string, value: any): Builder {
        this.values[columnName] = value;
        return this;
      }

      public ttl(seconds: number): Builder {
        this.ttlValue = seconds;
        return this;
      }

      public encoding(encoding: CassEncoding): Builder {
        this.encodingValue = encoding;
        return this;
      }

      public build(): string {
        if (!this.schema) {
          throw new Error('schema must be provided');
        }
        const { keyspace, name: table } = this.schema;
        if (!keyspace || !table) {
          throw new Error(
            'INSERT statements must provide a fully qualified keyspace and table name.',
          );
        }
        const columnNames = Object.keys(this.values).map((name) => `"${name}"`);
        if (columnNames.length === 0) {
          throw new Error(
            'No values provided. Please ensure at least primary key is specified (partition and any clustering keys)',
          );
        }

        checkCompletePrimaryKey(this.schema, this.values);

        const statementPieces = [
          `INSERT INTO ${keyspace}.${table} (${columnNames.join(', ')}) VALUES`,
        ];

        const columnMap = new Map<string, ITableColumn>();
        const addToMap = (col: ITableColumn) => columnMap.set(col.name, col);
        this.schema.partitionKeys.forEach(addToMap);
        this.schema.clusteringKeys.forEach(addToMap);
        this.schema.columns.forEach(addToMap);

        const valuesSection = [];
        for (const [columnName, value] of Object.entries(this.values)) {
          const tableColumnSchema = columnMap.get(columnName);
          if (!tableColumnSchema) {
            throw new Error(`Unexpected column name "${columnName}"`);
          }
          const { needsQuotes, type } = tableColumnSchema;
          if (value === null) {
            valuesSection.push('null');
          } else if (isCollectionType(type)) {
            valuesSection.push(getCollectionRowValueAsString(type, value));
          } else if (type === 'timestamp' && value instanceof Date) {
            valuesSection.push(`'${value.toISOString()}'`);
          } else if (type === 'date' || type === 'time') {
            // driver provides LocalDate/LocalTime classes that support custom toString()
            valuesSection.push(`'${value}'`);
          } else if (type.includes('blob')) {
            if (this.encodingValue) {
              if ((value as string).length === 0) {
                valuesSection.push('null');
              } else if (this.encodingValue === 'hex') {
                valuesSection.push(value);
              } else {
                const escapedValue = escapeValueString(value as string);
                if (this.encodingValue === 'ascii') {
                  valuesSection.push(`asciiAsBlob('${escapedValue}')`);
                } else {
                  valuesSection.push(`textAsBlob('${escapedValue}')`);
                }
              }
            } else {
              throw new Error(
                'Encoding must be specified to generate insert statement.',
              );
            }
          } else if (needsQuotes) {
            let valueToQuote;
            if (typeof value === 'string') {
              const re = new RegExp("'", 'g');
              valueToQuote = value.replace(re, "''");
            } else {
              valueToQuote = value;
            }
            valuesSection.push(`'${valueToQuote}'`);
          } else {
            valuesSection.push(value);
          }
        }
        statementPieces.push(`(${valuesSection.join(', ')})`);

        if (this.ttlValue) {
          statementPieces.push(`USING TTL ${this.ttlValue}`);
        }
        return statementPieces.join(' ');
      }
    }
    return Builder;
  }
}
