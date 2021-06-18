import { EntityType } from '@/typings/enums';
import { IEntityOwnership } from '@/typings/typings';

export function createTestKeyspace(
  cluster: string,
  env: string,
  entityName: string,
  owners: string[],
): IEntityOwnership {
  return createTestEntity(
    cluster,
    env,
    entityName,
    owners,
    EntityType.KEYSPACE,
  );
}

function createTestEntity(
  cluster: string,
  env: string,
  entityName: string,
  owners: string[],
  type: EntityType,
): IEntityOwnership {
  return {
    clusterName: cluster,
    env,
    name: entityName,
    owners,
    type: EntityType[type] as 'KEYSPACE' | 'TABLE',
  };
}
