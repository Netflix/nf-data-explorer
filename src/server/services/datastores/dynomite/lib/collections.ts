import setupLogger from '@/config/logger';
import Redis from 'ioredis';
import { IDynoCollectionKeyValue } from '../typings/dynomite';

const logger = setupLogger(module);

export async function deleteHashKeys(
  conn: Redis.Redis,
  key: string,
  fieldValues: IDynoCollectionKeyValue[],
): Promise<number> {
  const hashKeysToDelete = new Array<string>();
  fieldValues.forEach((field) => {
    if (field.type === 'hash') {
      hashKeysToDelete.push(field.key);
    }
  });
  if (hashKeysToDelete.length === 0) {
    throw new Error('At least one hash key must be provided');
  }
  return conn.hdel(key, ...hashKeysToDelete);
}

export async function deleteListItems(
  conn: Redis.Redis,
  key: string,
  fieldValues: IDynoCollectionKeyValue[],
): Promise<number> {
  const MARKED_FOR_DELETE = '___deleted___';

  const indicesToDelete = new Array<number>();
  fieldValues.forEach((field) => {
    if (field.type === 'list') {
      indicesToDelete.push(field.index);
    }
  });

  if (indicesToDelete.length === 0) {
    throw new Error('At least one field index must be provided');
  }

  // convert the list to numbers, then reverse sort
  const sortedReversedFields = indicesToDelete.sort().reverse();
  logger.info(JSON.stringify(sortedReversedFields));

  const promises = new Array<Promise<any>>();
  // Redis doesn't support deletion of keys by index, so we do a two-step mark and delete.
  sortedReversedFields.forEach((f) => {
    logger.info(`Marking index ${f} of ${key} for deletion`);
    promises.push(conn.lset(key, f, MARKED_FOR_DELETE));
  });

  await Promise.all(promises);
  logger.info(`Removing all fields marked for delete on key ${key}`);
  return conn.lrem(key, 0, MARKED_FOR_DELETE);
}

export async function deleteSetMembers(
  conn: Redis.Redis,
  key: string,
  fieldValues: IDynoCollectionKeyValue[],
): Promise<number> {
  const setMembersToRemove = new Array<string>();
  fieldValues.forEach((field) => {
    if (field.type === 'set') {
      setMembersToRemove.push(field.value);
    }
  });
  if (setMembersToRemove.length === 0) {
    throw new Error('At least one set member must be provided');
  }
  return conn.srem(key, setMembersToRemove);
}

export async function deleteZsetMembers(
  conn: Redis.Redis,
  key: string,
  fieldValues: IDynoCollectionKeyValue[],
): Promise<number> {
  const sortedKeysToDelete = new Array<string>();
  fieldValues.forEach((field) => {
    if (field.type === 'zset') {
      sortedKeysToDelete.push(field.value);
    }
  });
  if (sortedKeysToDelete.length === 0) {
    throw new Error('At least one hash key must be provided');
  }
  return conn.zrem(key, sortedKeysToDelete);
}
