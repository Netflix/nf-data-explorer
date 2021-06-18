import { EntityType } from '@/typings/enums';
import { IEntityOwnership } from '@/typings/typings';
import { IEntityAccessControlLoader } from '../typings/entity-acls';

export default class DefaultEntityAccessControlLoader
  implements IEntityAccessControlLoader {
  public async fetchAllEntities(): Promise<IEntityOwnership[]> {
    return [];
  }

  public async fetchEntity(
    _clusterName: string,
    _env: string,
    _type: EntityType,
    _entityName: string,
  ): Promise<IEntityOwnership | undefined> {
    return undefined;
  }
}
