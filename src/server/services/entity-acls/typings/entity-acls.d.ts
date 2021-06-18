import { EntityType } from '@/typings/enums';
import { IEntityOwnership } from '@/typings/typings';

/**
 * Used by the `EntityAccessControlCache` to load records from another service.
 */
export interface IEntityAccessControlLoader {
  fetchAllEntities(): Promise<IEntityOwnership[]>;

  fetchEntity(
    clusterName: string,
    env: string,
    type: EntityType,
    entityName: string,
  ): Promise<IEntityOwnership | undefined>;
}
