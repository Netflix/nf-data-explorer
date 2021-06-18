import CompactionOptions from '@/services/datastores/cassandra/lib/modules/schema-builder/compaction/CompactionOptions';

export class SizeTieredCompactionStrategyOptions extends CompactionOptions {
  private minThresholdValue: number | undefined = undefined;
  private maxThresholdValue: number | undefined = undefined;
  private minSSTableSizeValue: number | undefined = undefined;

  static get NAME(): string {
    return 'SizeTieredCompactionStrategy';
  }

  constructor() {
    super(SizeTieredCompactionStrategyOptions.NAME);
  }

  public minThreshold(min: number): SizeTieredCompactionStrategyOptions {
    this.minThresholdValue = min;
    return this;
  }

  public maxThreshold(max: number): SizeTieredCompactionStrategyOptions {
    this.maxThresholdValue = max;
    return this;
  }

  public minSSTableSize(
    minSizeInBytes: number,
  ): SizeTieredCompactionStrategyOptions {
    this.minSSTableSizeValue = minSizeInBytes;
    return this;
  }

  public buildSpecificOptions(): string[] {
    const options = new Array<string>();
    if (this.minThresholdValue !== undefined) {
      options.push(`'min_threshold' : ${this.minThresholdValue}`);
    }
    if (this.maxThresholdValue !== undefined) {
      options.push(`'max_threshold' : ${this.maxThresholdValue}`);
    }
    if (this.minSSTableSizeValue !== undefined) {
      options.push(`'min_sstable_size' : ${this.minSSTableSizeValue}`);
    }
    return options;
  }
}
