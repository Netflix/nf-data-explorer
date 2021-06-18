import setupLogger from '@/config/logger';
import { policies, types } from 'cassandra-driver';
const { retry } = policies;
const { RetryPolicy } = retry;

const logger = setupLogger(module);

/**
 * Custom retry policy that explicitly prevents retries.
 */
export default class NoRetryPolicy extends RetryPolicy {
  public onReadTimeout(
    requestInfo: policies.retry.OperationInfo,
    _consistency: types.consistencies,
    _received: number,
    _blockFor: number,
    _isDataPresent: boolean,
  ): any {
    const query = requestInfo ? requestInfo.query : 'N/A';
    logger.error(`readTimeout: ${query}`);
    return this.rethrowResult();
  }

  public onUnavailable(
    requestInfo: policies.retry.OperationInfo,
    _consistency: types.consistencies,
    _required: number,
    _alive: boolean,
  ): any {
    const query = requestInfo ? requestInfo.query : 'N/A';
    logger.error(`unavailable: ${query}`);
    return this.rethrowResult();
  }

  public onWriteTimeout(
    requestInfo: policies.retry.OperationInfo,
    _consistency: types.consistencies,
    _received: number,
    _blockFor: number,
    _writeType: string,
  ): any {
    const query = requestInfo ? requestInfo.query : 'N/A';
    logger.error(`writeTimeout: ${query}`);
    return this.rethrowResult();
  }
}
