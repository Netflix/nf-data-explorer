import CompressionOptions from '@/services/datastores/cassandra/lib/modules/schema-builder/CompressionOptions';
import SchemaStatement from '@/services/datastores/cassandra/lib/modules/schema-builder/SchemaStatement';
import { Version } from './Version';

/**
 * Encapsulates some of the options used for creating new tables.
 *
 * Constructor expects to be passed the original SQL statement used to create the table (the `parentStatement`).
 * When ready to generate the query, the user is expected to call `getQueryString()` of the table options.
 */
export default abstract class TableOptions extends SchemaStatement {
  private bloomFilterFPChance: number | undefined = undefined;
  private cacheStrategy: string | undefined = undefined;
  private commentOption: string | undefined = undefined;
  private compressionStrategy: string | undefined = undefined;
  private gcGraceSecondsValue: number | undefined = undefined;
  private defaultTtlValue: number | undefined = undefined;
  private memTableFlushValue: number | undefined = undefined;
  private readRepairChanceValue: number | undefined = undefined;
  private speculativeRetryValue: number | undefined = undefined;

  constructor(
    readonly parentStatement: SchemaStatement,
    readonly version: Version,
  ) {
    super();
  }

  /**
   * Sets the bloom filter positive chance.
   * @param   bloomFilterFalsePositiveChance    The FP value.
   * @return  Returns this instance.
   */
  public bloomFilterFalsePositiveChance(
    bloomFilterFPChance: number,
  ): TableOptions {
    this.bloomFilterFPChance = bloomFilterFPChance;
    return this;
  }

  /**
   * Sets the value to use for this table's caching strategy.
   * @param  cacheValue      The caching strategy to use.
   * @return Returns this instance.
   */
  public useCacheStrategy(cacheStrategy: string): TableOptions {
    this.cacheStrategy = cacheStrategy;
    return this;
  }

  /**
   * Sets the comment for this table.
   * @param  comment         The comment string.
   * @return Returns this instance.
   */
  public comment(comment: string): TableOptions {
    this.commentOption = comment;
    return this;
  }

  public compression(compression: CompressionOptions): TableOptions {
    this.compressionStrategy = compression.build();
    return this;
  }

  public gcGraceSeconds(gcGraceSecondsValue: number): TableOptions {
    this.gcGraceSecondsValue = gcGraceSecondsValue;
    return this;
  }

  public defaultTtl(defaultTtlValue: number): TableOptions {
    this.defaultTtlValue = defaultTtlValue;
    return this;
  }

  public memtableFlushPeriod(memTableFlushValue: number): TableOptions {
    this.memTableFlushValue = memTableFlushValue;
    return this;
  }

  public readRepairChance(readRepairChanceValue: number): TableOptions {
    this.readRepairChanceValue = readRepairChanceValue;
    return this;
  }

  public speculativeRetry(speculativeRetryValue: number): TableOptions {
    this.speculativeRetryValue = speculativeRetryValue;
    return this;
  }

  /**
   * Generates the entire query string for the original statement plus any additional table options.
   * @return Returns the query string suitable to passing to the driver for execution.
   */
  public getQueryString(): string {
    let combinedStatement = this.parentStatement.getQueryString();
    const options = this._buildCommonOptions();
    this._addSpecificOptions(options);
    if (options.length > 0) {
      combinedStatement += `${this.STATEMENT_START}WITH `;
      combinedStatement += options.sort().join(`${this.STATEMENT_START}AND `);
    }
    return combinedStatement;
  }

  protected abstract _addSpecificOptions(options: string[]): void;

  private _buildCommonOptions() {
    const options: string[] = [];
    if (this.bloomFilterFPChance !== undefined) {
      options.push(`bloom_filter_fp_chance = ${this.bloomFilterFPChance}`);
    }
    if (this.cacheStrategy !== undefined) {
      options.push(`caching = '${this.cacheStrategy}'`);
    }
    if (this.commentOption !== undefined) {
      options.push(`comment = '${this.commentOption}'`);
    }
    if (this.compressionStrategy !== undefined) {
      options.push(`compression = ${this.compressionStrategy}`);
    }
    if (this.defaultTtlValue !== undefined) {
      options.push(`default_time_to_live = ${this.defaultTtlValue}`);
    }
    if (this.gcGraceSecondsValue !== undefined) {
      options.push(`gc_grace_seconds = ${this.gcGraceSecondsValue}`);
    }
    if (this.memTableFlushValue !== undefined) {
      options.push(`memtable_flush_period_in_ms = ${this.memTableFlushValue}`);
    }
    if (this.readRepairChanceValue !== undefined) {
      options.push(`read_repair_chance = ${this.readRepairChanceValue}`);
    }
    if (this.speculativeRetryValue !== undefined) {
      options.push(`speculative_retry = '${this.speculativeRetryValue}'`);
    }
    return options;
  }
}
