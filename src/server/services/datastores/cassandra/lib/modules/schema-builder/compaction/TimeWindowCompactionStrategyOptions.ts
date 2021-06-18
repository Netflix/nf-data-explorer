import CompactionOptions from '@/services/datastores/cassandra/lib/modules/schema-builder/compaction/CompactionOptions';

export class TimeWindowCompactionStrategyOptions extends CompactionOptions {
  private compactionWindowUnitValue: string | undefined = undefined;
  private compactionWindowSizeValue: number | undefined = undefined;

  static get NAME(): string {
    return 'TimeWindowCompactionStrategy';
  }

  constructor() {
    super(TimeWindowCompactionStrategyOptions.NAME);
  }

  public compactionWindowUnit(
    unit: string,
  ): TimeWindowCompactionStrategyOptions {
    this.compactionWindowUnitValue = unit;
    return this;
  }

  public compactionWindowSize(
    size: number,
  ): TimeWindowCompactionStrategyOptions {
    this.compactionWindowSizeValue = size;
    return this;
  }

  public buildSpecificOptions(): string[] {
    const options = new Array<string>();
    if (this.compactionWindowUnitValue) {
      options.push(
        `'compaction_window_unit' : '${this.compactionWindowUnitValue}'`,
      );
    }
    if (this.compactionWindowSizeValue) {
      options.push(
        `'compaction_window_size' : ${this.compactionWindowSizeValue}`,
      );
    }
    return options;
  }
}
