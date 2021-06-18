import { Version } from './Version';

export default class CompressionOptions {
  public static get ALGORITHMS(): Record<string, string> {
    return {
      NONE: '',
      LZ4: 'LZ4Compressor',
      SNAPPY: 'SnappyCompressor',
      DEFLATE: 'DeflateCompressor',
    };
  }

  private chunkLengthInKBValue: number | undefined = undefined;
  private crcCheckChanceValue: number | undefined = undefined;

  constructor(readonly algorithm: string, readonly version: Version) {}

  public chunkLengthKb(chunkLengthInKB: number): CompressionOptions {
    // tslint:disable-next-line
    if ((chunkLengthInKB & (chunkLengthInKB - 1)) !== 0) {
      // eslint-disable-line no-bitwise
      throw new Error('Compression chunk length must be a valid power of 2.');
    }
    this.chunkLengthInKBValue = chunkLengthInKB;
    return this;
  }

  public crcCheckChance(crcCheckChance: number): CompressionOptions {
    this.crcCheckChanceValue = crcCheckChance;
    return this;
  }

  public build(): string {
    // compression disabled
    if (this.algorithm === CompressionOptions.ALGORITHMS.NONE) {
      if (this.version.isV3x()) {
        return '{ \'enabled\': false }';
      }
      return '{ \'sstable_compression\' : \'\' }';
    }

    // compression enabled
    const compressionKeyword = this.version.isV3x()
      ? 'class'
      : 'sstable_compression';
    const options = [`'${compressionKeyword}': '${this.algorithm}'`];
    if (this.chunkLengthInKBValue !== undefined) {
      options.push(`'chunk_length_kb' : ${this.chunkLengthInKBValue}`);
    }
    if (this.crcCheckChanceValue !== undefined) {
      options.push(`'crc_check_chance' : ${this.crcCheckChanceValue}`);
    }
    return `{ ${options.join(', ')} }`;
  }
}
