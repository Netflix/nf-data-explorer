import Cursor from '@/services/datastores/dynomite/lib/Cursor';

/**
 * ScanResult wraps a Cursor and aggregates results.
 */
export default class ScanAggregator {
  public readonly cursor: Cursor;
  public results: string[];
  public numScans: number;

  constructor(cursor: Cursor) {
    this.cursor = cursor;
    this.results = new Array<string>();
    this.numScans = 0;
  }

  get scanCount(): number {
    return this.numScans;
  }

  get total(): number {
    return this.results.length;
  }

  /**
   * Updates this scan result with the results from the given host. Also updates the Cursor with the
   * next cursor value if there are more results.
   * @param host
   * @param nextCursor
   * @param results
   * @returns Returns this instance to simplify chaining.
   */
  public addHostScanResults(
    host: string,
    nextCursor: number,
    results: string[],
  ): ScanAggregator {
    this.numScans += 1;
    this.cursor.updateCursor(host, nextCursor);
    this.results = this.results.concat(results);
    return this;
  }
}
