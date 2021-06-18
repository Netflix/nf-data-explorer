import { EntityType } from '@/typings/enums';

/**
 * Used by the `EntityAccessControlService` to perform reads and updates of entity ownership information.
 */
export interface IEntityAccessControlProvider {
  /**
   * Fetches the list of entity owners.
   * @param clusterName The name of the cluster.
   * @param env The cluster environment (prod/test)
   * @param type The type of entity to fetch.
   * @param entityName The name of the entity.
   */
  getEntityOwners(
    clusterName: string,
    env: string,
    type: EntityType,
    entityName: string,
  ): Promise<string[]>;

  /**
   * Updates the list of entity owners.
   * @param clusterName The name of the cluster.
   * @param env The cluster environment (prod/test)
   * @param type The type of entity to fetch.
   * @param entityName The name of the entity.
   * @param owners The new list of owners to replace the current owners with.
   */
  setEntityOwners(
    clusterName: string,
    env: string,
    type: EntityType,
    entityName: string,
    owners: string[],
  ): Promise<void>;
}
