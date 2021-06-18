import {
  ICassandraAccessDef,
  IKeyspace,
} from '@/services/datastores/cassandra/typings/cassandra';
import { EntityType } from '@/typings/enums';
import { IClusterDefinition } from '@/typings/typings';
import { filterAccessibleEntities } from '@/utils/acl-utils';
import { isClusterShared } from '@/utils/app-utils';
import { IRequestUserInfo } from '@sharedtypes/express';

/**
 * Helper method for building out the necessary Cassandra access information used for restricting
 * access to keyspaces on shared clusters.
 * @param user         The user's info.
 * @param cluster      The cluster being accessed.
 * @param allKeyspaces The list of all available keyspaces on this cluster.
 * @returns Returns an access definition object that will contain the shared flag and the list of
 * user permitted keyspace names.
 */
export async function getCassandraAccess(
  user: IRequestUserInfo,
  cluster: IClusterDefinition,
  allKeyspaces: IKeyspace[],
): Promise<ICassandraAccessDef> {
  const userKeyspaces = await filterAccessibleEntities(
    user,
    cluster,
    EntityType.KEYSPACE,
    allKeyspaces.map((keyspace) => keyspace.name),
  );
  return {
    isShared: isClusterShared(cluster.name),
    userKeyspaceNames: userKeyspaces,
  };
}
