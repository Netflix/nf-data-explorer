import CompactionOptions from '@/services/datastores/cassandra/lib/modules/schema-builder/compaction/CompactionOptions';

export class LeveledCompactionStrategyOptions extends CompactionOptions {
  private ssTableSizeInMBValue: number | undefined = undefined;

  static get NAME(): string {
    return 'LeveledCompactionStrategy';
  }

  constructor() {
    super(LeveledCompactionStrategyOptions.NAME);
  }

  public ssTableSizeInMB(size: number): LeveledCompactionStrategyOptions {
    this.ssTableSizeInMBValue = size;
    return this;
  }

  public buildSpecificOptions(): string[] {
    const options = new Array<string>();
    if (this.ssTableSizeInMBValue) {
      options.push(`'sstable_size_in_mb' : ${this.ssTableSizeInMBValue}`);
    }
    return options;
  }
}
