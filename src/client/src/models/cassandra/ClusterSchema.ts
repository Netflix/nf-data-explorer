import { IClusterSchemaColumn } from '@cassandratypes/cassandra';
import { get, set } from 'lodash';

// TODO consolidate this type with the standard ITableColumn type
export interface IColumnDef {
  name: string;
  type: 'partition' | 'clustering' | 'regular';
  isPartitionKey: boolean;
  isClusteringKey: boolean;
}

export default class ClusterSchema {
  private schemaMap = {} as {
    [keyspaceName: string]: {
      [tableName: string]: { [columnName: string]: string };
    };
  };

  constructor(schemaColumns: IClusterSchemaColumn[]) {
    schemaColumns.forEach(({ keyspace, table, column, type }) => {
      set(this.schemaMap, `${keyspace}.${table}.${column}`, type);
    });
  }

  public getKeyspaceNames(): string[] {
    return Object.keys(this.schemaMap).sort((a, b) => a.localeCompare(b));
  }

  public getTableNames(keyspaceName: string): string[] {
    const keyspace = this.schemaMap[this.sanitizeName(keyspaceName)];
    if (!keyspace) {
      return [];
    }
    return Object.keys(keyspace).sort((a, b) => a.localeCompare(b));
  }

  public getColumnNames(keyspaceName: string, tableName: string): string[] {
    const table = get(this.schemaMap, `${keyspaceName}.${tableName}`);
    if (!table) {
      return [];
    }
    return Object.keys(table).sort((a, b) => a.localeCompare(b));
  }

  public getColumns(
    keyspaceName: string,
    tableName: string,
    options = {} as { filterable?: boolean },
  ): IColumnDef[] {
    const tableItem = this.getTableColumns(keyspaceName, tableName);
    if (!tableItem) {
      return [];
    }

    const columnDefinitions = [] as any[];
    for (const [columnName, type] of Object.entries(tableItem)) {
      const isPartitionKey = type === 'partition';
      const isClusteringColumn = type === 'clustering';
      if (
        !options.filterable ||
        (options.filterable && (isPartitionKey || isClusteringColumn))
      ) {
        columnDefinitions.push({
          name: columnName,
          type,
          isPartitionKey,
          isClusteringColumn,
        });
      }
    }

    // TODO opportunity to combine with table-schema sorting
    return columnDefinitions.sort((a, b) => {
      const { name: aName, type: aType } = a;
      const { name: bName, type: bType } = b;

      if (aType === 'partition' && bType !== 'partition') {
        return -1;
      } else if (aType !== 'partition' && bType === 'partition') {
        return 1;
      } else if (aType === 'partition' && bType === 'partition') {
        return aName - bName;
      }

      if (aType === 'clustering' && bType !== 'clustering') {
        return -1;
      } else if (aType !== 'clustering' && bType === 'clustering') {
        return 1;
      } else if (aType === 'clustering' && bType === 'clustering') {
        return aName - bName;
      }

      if (aName < bName) {
        return -1;
      } else if (aName > bName) {
        return 1;
      }
      return 0;
    });
  }

  public hasKeyspace(keyspaceName: string): boolean {
    return !!get(this.schemaMap, keyspaceName);
  }

  public hasTable(keyspaceName: string, tableName: string): boolean {
    return !!get(this.schemaMap, `${keyspaceName}.${tableName}`);
  }

  private getTableColumns(keyspaceName: string, tableName: string) {
    return (get(
      this.schemaMap,
      `${this.sanitizeName(keyspaceName)}.${this.sanitizeName(tableName)}`,
    ) as unknown) as { [columnName: string]: string } | undefined;
  }

  private sanitizeName(name: string) {
    return name ? name.replace(/"/g, '') : name;
  }
}
