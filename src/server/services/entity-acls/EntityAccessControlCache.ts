import setupLogger from '@/config/logger';
import { IEntityAccessControlLoader } from '@/services/entity-acls/typings/entity-acls';
import { EntityType } from '@/typings/enums';
import { IEntityOwnership } from '@/typings/typings';
import LRU from 'lru-cache';

const logger = setupLogger(module);

const TTL = 1000 * 60 * 2;

export default class EntityAccessControlCache {
  private cache: LRU<string, IEntityOwnership | undefined>;

  constructor(readonly loader: IEntityAccessControlLoader) {
    // using unbounded LRU cache to handle expiring keys (TTL)
    this.cache = new LRU<string, IEntityOwnership>({
      maxAge: TTL,
      dispose: (key, _n) => {
        logger.info(`*** disposing of ${key} ***`);
      },
      noDisposeOnSet: true,
    });
  }

  /**
   * Refresh the entire cache (if supported by loader).
   */
  public async refresh(): Promise<void> {
    logger.info('performing full cache refresh');
    try {
      const entities = await this.loader.fetchAllEntities();
      entities.forEach((entity) => {
        const key = this.buildKeyFromEntity(entity);
        this.cache.set(key, entity);
      });
    } catch (err) {
      logger.error('Loader failed to fetch all entities.', err);
    }
  }

  /**
   * Fetches a single entity from the cache. If the item is not in the cache,
   * the loader will be used to try and fetch the key.
   * @param clusterName The cluster name
   * @param env The environment name
   * @param type The type of entity
   * @param entityName The unique name of the entity
   */
  public async get(
    clusterName: string,
    env: string,
    type: EntityType,
    entityName: string,
  ): Promise<IEntityOwnership | undefined> {
    logger.info(`fetching ${EntityType[type]} "${entityName}" from cache`);
    const key = this.buildKey(clusterName, env, type, entityName);
    let value = this.cache.get(key);
    // if the value can't be found or has expired, refresh the cache and try again
    if (value === undefined) {
      logger.info(`cache miss for ${EntityType[type]} "${entityName}"`);
      try {
        value = await this.loader.fetchEntity(
          clusterName,
          env,
          type,
          entityName,
        );
        logger.info(`loaded cache ${EntityType[type]} "${entityName}"`);
        this.cache.set(key, value);
      } catch (err) {
        logger.error(
          `Loaded failed to fetch ${EntityType[type]} "${entityName}"`,
          err,
        );
      }
    }
    return value;
  }

  /**
   * Fetches an entry from the cache if present. This method will NOT attempt to
   * load the record in the event of a cache miss. This method can also be used
   * effectively with the `refresh()` method.
   * @param clusterName The cluster name
   * @param env The environment name
   * @param type The type of entity
   * @param entityName The unique name of the entity
   * @see refresh()
   */
  public async getIfPresent(
    clusterName: string,
    env: string,
    type: EntityType,
    entityName: string,
  ): Promise<IEntityOwnership | undefined> {
    const key = this.buildKey(clusterName, env, type, entityName);
    return this.cache.get(key);
  }

  /**
   * Returns all the values currently in the cache.
   */
  public values(): Array<IEntityOwnership> {
    return this.cache.values().filter((value) => !!value) as IEntityOwnership[];
  }

  /**
   * Iterates over all the keys in order of recent-ness.
   * @param callbackFn
   */
  public forEach(
    callbackFn: (value: IEntityOwnership, key: string) => void,
  ): void {
    return this.cache.forEach((value, key) => {
      if (value) {
        callbackFn(value, key);
      }
    });
  }

  private buildKeyFromEntity(entity: IEntityOwnership): string {
    return this.buildKey(
      entity.clusterName,
      entity.env,
      EntityType[entity.type as keyof typeof EntityType],
      entity.name,
    );
  }

  private buildKey(
    clusterName: string,
    env: string,
    type: EntityType,
    entityName: string,
  ): string {
    const typeString = EntityType[type];
    return `${clusterName.toLowerCase()}:::${env.toLowerCase()}:::${typeString}:::${entityName}`;
  }
}
