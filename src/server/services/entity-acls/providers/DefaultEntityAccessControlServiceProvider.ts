import { EntityType } from '@/typings/enums';
import { IEntityAccessControlProvider } from './EntityAccessControlProvider';

export default class DefaultEntityAccessControlServiceProvider
  implements IEntityAccessControlProvider {
  public async getEntityOwners(
    _clusterName: string,
    _env: string,
    _type: EntityType,
    _entityName: string,
  ): Promise<string[]> {
    return [];
  }

  public async setEntityOwners(
    _clusterName: string,
    _env: string,
    _type: EntityType,
    _entityName: string,
    _owners: string[],
  ): Promise<void> {
    return;
  }
}
