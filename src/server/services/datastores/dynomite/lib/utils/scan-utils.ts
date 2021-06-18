import setupLogger from '@/config/logger';
import Cursor from '@/services/datastores/dynomite/lib/Cursor';
import DynomiteCluster from '@/services/datastores/dynomite/lib/DynomiteCluster';
import ScanAggregator from '@/services/datastores/dynomite/lib/utils/ScanAggregator';
import { IScanResult } from '@/services/datastores/dynomite/typings/dynomite';

const logger = setupLogger(module);

function logIndented(scanCount: number, msg: string) {
  const indent = new Array(scanCount).join(' ');
  logger.debug(indent + msg);
}

/**
 * Performs a SCAN operation.
 * @param cluster The DynomiteCluster to scan.
 * @param cursor The existing Cursor object that preserves the state of the scan across hosts.
 * @param match The string to match key names against.
 * @param count The count of keys to scan on each successive SCAN operation.
 * @param pageSize The desired page size of results.
 */
export async function scan(
  cluster: DynomiteCluster,
  cursor: Cursor,
  match: string,
  count: number,
  pageSize: number,
): Promise<IScanResult> {
  const result = await doScan(
    cluster,
    new ScanAggregator(cursor),
    match,
    count,
    pageSize,
  );
  logger.info(`found ${result.total} results after ${result.scanCount} scans`);
  return {
    cursor: result.cursor.toClientCursor(),
    keys: result.results.sort(),
    count: result.total,
  };
}

async function doScan(
  cluster: DynomiteCluster,
  aggregator: ScanAggregator,
  match: string,
  count: number,
  pageSize: number,
): Promise<ScanAggregator> {
  const { cursor, scanCount: scans } = aggregator;
  const firstIncomplete = cursor.getFirstIncomplete();
  if (!firstIncomplete) {
    throw new Error('Invalid cursor provided');
  }

  const { host, cursor: cursorValue } = firstIncomplete;
  logIndented(scans, `performing scan: host=${host}, cursor=${cursorValue}`);

  const conn = await cluster.getConnectionToHost(host);

  try {
    logIndented(
      scans,
      `SCAN ${cursorValue || 0} MATCH ${match} COUNT ${count}`,
    );
    const result = await conn.scan(
      cursorValue || 0,
      'MATCH',
      `${match}`,
      'COUNT',
      count,
    );
    const nextCursor = +result[0];
    const hits = result[1];

    // update the result
    aggregator.addHostScanResults(host, nextCursor, hits);

    const isPartialResultSet = aggregator.total < pageSize;
    if (nextCursor !== 0 && aggregator.total === 0) {
      // empty result set, but non-zero cursor
      logIndented(
        scans,
        `  got an empty result set, continuing with cursor: ${nextCursor}...`,
      );
      return doScan(cluster, aggregator, match, count, pageSize);
    } else if (nextCursor !== 0 && isPartialResultSet) {
      // partial result set, but continue scanning current host to return a reasonable page size
      logIndented(
        scans,
        `  got a partial result set (${aggregator.total}), continuing search with cursor: ${nextCursor}...`,
      );
      return doScan(cluster, aggregator, match, count, pageSize);
    } else if (cursor.getFirstIncomplete() && isPartialResultSet) {
      // partial result set and other hosts have incomplete cursors
      logIndented(
        scans,
        `  got a partial result set (${aggregator.total}), trying other hosts...`,
      );
      return doScan(cluster, aggregator, match, count, pageSize);
    }
    // found all results
    logIndented(scans, `  fetched all results (${aggregator.total}).`);
    return aggregator;
  } catch (err) {
    logger.error('scan error encountered');
    logger.error(err);
    throw err;
  }
}
