import TableOptions from '@/services/datastores/cassandra/lib/modules/schema-builder/TableOptions';
import CompactionOptions from './compaction/CompactionOptions';
import Create from './Create';
import { Version } from './Version';

/**
 * @private
 */
export default class CreateTableOptions extends TableOptions {
  private clusterOrder: Array<{ name: string; direction: string }>;
  private keyCaching: string | undefined = undefined;
  private rowCaching: string | undefined = undefined;
  private compactionStrategy: string | undefined = undefined;
  private compactStorageValue = false;

  constructor(parentStatement: Create, version: Version) {
    super(parentStatement, version);
    this.clusterOrder = [];
  }

  public caching(keyCaching: string, rowCaching: string): CreateTableOptions {
    this.keyCaching = keyCaching;
    this.rowCaching = rowCaching;
    return this;
  }

  /**
   * Specifies the clustering order for a column. Requires that the column be declared first.
   * @param   columnName      The name of the existing clustering column.
   * @param   direction       The direction to sort ('asc' or 'desc').
   * @return  The current CreateTableOptions instance.
   */
  public clusteringOrder(
    columnName: string,
    direction: string,
  ): CreateTableOptions {
    if (
      !(this.parentStatement as Create).clusteringColumns.find(
        (col) => col.name === columnName,
      )
    ) {
      throw new Error(
        `Clustering column ${columnName} is unknown. Did you forget to declare it first?`,
      );
    }

    this.clusterOrder.push({
      name: columnName,
      direction,
    });
    return this;
  }

  public compactionOptions(strategy: CompactionOptions): CreateTableOptions {
    this.compactionStrategy = strategy.build();
    return this;
  }

  /**
   * Enables compact storage on this table.
   */
  public compactStorage(): CreateTableOptions {
    this.compactStorageValue = true;
    return this;
  }

  protected _addSpecificOptions(options: string[]): string[] {
    if (this.clusterOrder.length > 0) {
      const clusterOrderPart = this.clusterOrder
        .map((col) => `${col.name} ${col.direction}`)
        .join(', ');
      options.push(`CLUSTERING ORDER BY (${clusterOrderPart})`);
    }
    if (this.compactStorageValue) {
      options.push('COMPACT STORAGE');
    }
    if (this.compactionStrategy) {
      options.push(`compaction = ${this.compactionStrategy}`);
    }
    if (this.keyCaching && this.rowCaching) {
      options.push(
        `caching = { 'keys' : '${this.keyCaching}', 'rows_per_partition' : '${this.rowCaching}' }`,
      );
    }
    return options;
  }
}
