import setupLogger from '@/config/logger';
import { IExplorer } from '@/services/datastores/base/datastore';
import Cursor from '@/services/datastores/dynomite/lib/Cursor';
import { MAX_KEY_STRING_SIZE_CHARS } from '@/services/datastores/dynomite/lib/dynomite-constants';
import DynomiteCluster from '@/services/datastores/dynomite/lib/DynomiteCluster';
import types from '@/services/datastores/dynomite/lib/DynomiteTypes';
import {
  FieldOperationsNotSupportedForTypeError,
  KeyNotFoundError,
  KeyTooLargeError,
} from '@/services/datastores/dynomite/lib/errors';
import {
  getKeyCountFromInfo,
  parseInfoString,
} from '@/services/datastores/dynomite/lib/utils/redis-info-utils';
import { scan } from '@/services/datastores/dynomite/lib/utils/scan-utils';
import {
  IClientCursor,
  IDynoCollectionKeyValue,
  IDynomiteInfo,
  IKeyValue,
  IScanResult,
} from '@/services/datastores/dynomite/typings/dynomite';
import { IClusterDefinition } from '@/typings/typings';
import {
  deleteHashKeys,
  deleteListItems,
  deleteSetMembers,
  deleteZsetMembers,
} from './collections';
import { ValueType } from 'ioredis';

const logger = setupLogger(module);
const EMPTY_RESULT = {
  cursor: { complete: true },
  keys: [],
  count: 0,
} as IScanResult;

/**
 * @class
 */
export default class DynomiteExplorer implements IExplorer {
  private dynomiteCluster: DynomiteCluster;

  constructor(readonly cluster: IClusterDefinition) {
    // setup a dynomite cluster to handle delegated calls that require region-awareness
    this.dynomiteCluster = new DynomiteCluster(cluster);
  }

  /**
   * Adds fields to the given key. If the key doesn't exist, it will be created.
   * Operation is performed via a single call to the database wherever possible.
   * @param type        The type of the key.
   * @param key         The name of the key to add fields to.
   * @param fieldValues Array of field definitions
   */
  public async addFields(
    type: string,
    key: string,
    fieldValues: IDynoCollectionKeyValue[],
  ): Promise<any> {
    const conn = await this.dynomiteCluster.getConnection();
    switch (type) {
      case types.string:
        throw new Error(
          'Cannot add fields to strings. Please create a key of a type that supports fields.',
        );
      case types.list:
        return conn.rpush(
          key,
          fieldValues.map((r) => r.value),
        ); // list members don't provide indices
      case types.set:
        return conn.sadd(
          key,
          fieldValues.map((r) => r.value),
        );
      case types.hash:
        const keyValuePairs = new Array<string>();
        fieldValues.forEach((r) => {
          if (r.type === 'hash') {
            keyValuePairs.push(r.key, r.value);
          }
        });
        if (keyValuePairs.length === 0) {
          throw Error('No hash key/value pairs provided');
        }
        return conn.hmset(key, keyValuePairs);
      case types.zset:
        const zsetItems = new Array<string>();
        fieldValues.forEach((r) => {
          if (r.type === 'zset') {
            zsetItems.push(r.score);
            zsetItems.push(r.value);
          }
        });
        if (zsetItems.length === 0) {
          throw Error('No zset score/value pairs provided');
        }
        return conn.zadd(key, zsetItems as any);
      case types.none:
        throw new KeyNotFoundError(key);
      default:
        throw new Error(`Unsupported key type: ${type}`);
    }
  }

  /**
   * Deletes the list of fields from the given key.
   * Note, not all data types support fields.
   * @param key      The name of the key.
   * @param fields   Array of field names to delete.
   */
  public async deleteFields(
    key: string,
    fieldValues: IDynoCollectionKeyValue[],
  ): Promise<any> {
    const conn = await this.dynomiteCluster.getConnection();
    const keyType = await conn.type(key);
    switch (keyType) {
      case types.string: {
        throw new Error(
          'Cannot delete field from string types. Please use deleteKey() method instead.',
        );
      }
      case types.list:
        return deleteListItems(conn, key, fieldValues);
      case types.set:
        return deleteSetMembers(conn, key, fieldValues);
      case types.hash:
        return deleteHashKeys(conn, key, fieldValues);
      case types.zset:
        return deleteZsetMembers(conn, key, fieldValues);
      case types.none:
        throw new KeyNotFoundError(key);
      default:
        throw new Error(`Unsupported key type: ${keyType}`);
    }
  }

  /**
   * Deletes a given key.
   * @param {String} key The name of the key to delete.
   * @returns {Promise.<Object>}
   */
  public async deleteKey(key: string): Promise<{ count: number }> {
    logger.info('DynomiteExplorer:deleteKey()');
    const conn = await this.dynomiteCluster.getConnection();
    const result = await conn.del(key);
    if (result === 0) {
      throw new KeyNotFoundError(key);
    }
    return { count: result };
  }

  /**
   * Returns an object containing cluster level information.
   * @returns Returns a Promise that will resolve with an Array of info objects for each of the
   *          nodes in the availability zone / rack / ring.
   */
  public async getInfo(): Promise<IDynomiteInfo[]> {
    logger.info('DynomiteExplorer:getInfo()');
    const results = (await this.dynomiteCluster.executeCommandInSingleZone(
      (conn) => conn.info() as any,
    )) as string[];
    return results.map((result) => parseInfoString(result));
  }

  /**
   * Returns the total number of keys available.
   */
  public async getKeyCount(): Promise<number> {
    const results = (await this.dynomiteCluster.executeCommandInSingleZone(
      (conn) => conn.info() as any,
    )) as string[];
    return results.reduce(
      (previous, current) => previous + getKeyCountFromInfo(current),
      0,
    );
  }

  /**
   * Fetches the value of a specific key.
   *
   * Returns an object of the following format:
   *
   *  {
   *      type: "String",
   *      ttl: Number,
   *      value: <Object>
   *  }
   *
   * @param {String} key
   * @returns {Promise.<Object>}
   */
  public async getValue(key: string): Promise<IKeyValue> {
    const conn = await this.dynomiteCluster.getConnection();
    const type = await conn.type(key);
    let value;
    switch (type) {
      case types.string:
        const len = await conn.strlen(key);
        if (len > MAX_KEY_STRING_SIZE_CHARS) {
          throw new KeyTooLargeError(key, len);
        }
        value = await conn.get(key);
        break;
      case types.list:
        value = await conn.lrange(key, 0, -1);
        break;
      case types.set:
        value = await conn.smembers(key);
        break;
      case types.hash:
        value = await conn.hgetall(key);
        break;
      case types.zset:
        value = await conn.zrange(key, 0, -1, 'WITHSCORES');
        break;
      case types.none:
        throw new KeyNotFoundError(key);
      default:
        throw new Error(`Unsupported key type: ${type}`);
    }
    const ttl = await conn.ttl(key);
    return { name: key, value, type, ttl };
  }

  /**
   * Updates the fields of an aggregate key type.
   * @param key          The name of the key to be updated.
   * @param fieldValues  An array of field value pairs.
   */
  public async updateFields(
    key: string,
    fieldValues: IDynoCollectionKeyValue[],
  ): Promise<boolean> {
    const conn = await this.dynomiteCluster.getConnection();
    const type = await conn.type(key);

    const supportedKeyTypes = [types.list, types.hash, types.zset];
    if (!supportedKeyTypes.includes(type)) {
      throw new FieldOperationsNotSupportedForTypeError(
        key,
        type,
        supportedKeyTypes,
      );
    }

    const fieldPairs = [] as string[];
    switch (type) {
      case types.list: {
        // redis doesn't support setting multiple list members in a single call
        const promises = fieldValues.map((r) => {
          if (r.type === 'list') {
            return conn.lset(key, r.index, r.value);
          }
          return Promise.resolve('OK');
        });
        await Promise.all(promises);
        break;
      }
      case types.hash:
        fieldValues.forEach((r) => {
          if (r.type === 'hash') {
            fieldPairs.push(r.key);
            fieldPairs.push(r.value);
          }
        });
        await conn.hmset(key, fieldPairs);
        break;
      case types.zset:
        fieldValues.forEach((r) => {
          if (r.type === 'zset') {
            fieldPairs.push(r.score);
            fieldPairs.push(r.value);
          }
        });
        await conn.zadd(key, fieldPairs as any);
        break;
    }
    logger.info('field updated successfully');
    return true;
  }

  /**
   * Sets the given key to the given value.
   * @param key
   * @param value
   * @returns
   */
  public async setValue(key: string, value: ValueType): Promise<any> {
    const conn = await this.dynomiteCluster.getConnection();
    return conn.set(key, value);
  }

  /**
   * Sets the expiration value for the given key.
   * @param key     The name of the key to set expiration.
   * @param ttl     The expiration value in seconds. Set to null to persist the key
   *                (i.e. remove the expiration).
   */
  public async setExpiration(
    key: string,
    ttl: number | undefined,
  ): Promise<any> {
    const conn = await this.dynomiteCluster.getConnection();
    if (ttl === undefined) {
      return conn.persist(key);
    }
    return conn.expire(key, ttl);
  }

  /**
   * Returns a set of matching keys.
   * @param cursor
   * @param match
   * @param count
   * @param pageSize
   */
  public async getKeys(
    cursorObj: IClientCursor,
    match: string,
    count: number,
    pageSize: number,
  ): Promise<IScanResult> {
    if (match.indexOf('*') < 0) {
      // as an optimization, if the user isn't search for a wildcard key, just try direct key access
      try {
        await this.getValue(match);
        return {
          cursor: { complete: true },
          keys: [match],
          count: 1,
        };
      } catch (err) {
        if (err instanceof KeyNotFoundError) {
          return EMPTY_RESULT;
        }
        throw err;
      }
    } else {
      // otherwise we need to perform a scan to find matching keys
      let cursor: Cursor;
      if (cursorObj) {
        // reuse the existing client cursor if provided
        cursor = Cursor.fromClientCursor(cursorObj);
      } else {
        // create a new cursor with knowledge of all the hosts in the AZ
        const ringMembers = this.dynomiteCluster.getFirstRingMembers();
        logger.debug(
          `no scan cursor provided. setting up cursor: ${JSON.stringify(
            ringMembers,
          )}`,
        );
        cursor = new Cursor(ringMembers);
      }

      const result = await scan(
        this.dynomiteCluster,
        cursor,
        match,
        count,
        pageSize,
      );
      return result;
    }
  }

  public async shutdown(): Promise<void> {
    this.dynomiteCluster.disconnect();
  }
}
