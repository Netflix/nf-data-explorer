import { getConfig } from '@/config/configuration';
import { getEntityAccessControlCache } from '@/config/services';
import ClusterAclsNotLoadedError from '@/model/errors/ClusterAclsNotLoadedError';
import ClusterNotAuthorizedError from '@/model/errors/ClusterNotAuthorizedError';
import EntityNotAuthorizedError from '@/model/errors/EntityNotAuthorizedError';
import { getStore } from '@/model/store';
import { EntityType } from '@/typings/enums';
import {
  IClusterDefinition,
  IClusterOwnership,
  IClusterSummary,
  IEntityOwnership,
} from '@/typings/typings';
import { isClusterShared } from '@/utils/app-utils';
import { isUserAuthorized } from '@/utils/user-utils';
import { IRequestUserInfo } from '@sharedtypes/express';

/**
 * Checks to see if a given user request can access a given cluster.
 * @param user          The user info.
 * @param cluster       The cluster to access.
 * @return Returns true if the user can access the given cluster.
 * @throws {Error}      If access control information isn't available for the cluster.
 * @throws {Error}      If the user doesn't have any group information.
 */
export function canUserAccessCluster(
  user: IRequestUserInfo,
  cluster: IClusterDefinition | IClusterSummary,
): boolean {
  const {
    ALL_CLUSTERS_MEMBERS,
    CLUSTER_ACCESS_CONTROL_ENABLED,
    RESTRICTED_CLUSTERS,
    UNRESTRICTED_CLUSTERS,
    REQUIRE_AUTHENTICATION,
  } = getConfig();

  const clusterName = cluster.name;
  if (!REQUIRE_AUTHENTICATION || !CLUSTER_ACCESS_CONTROL_ENABLED) {
    return true;
  }

  const clusterAclDef = getClusterAclDef(clusterName);
  if (!clusterAclDef) {
    return false;
  }

  // when we check user access to clusters, we also merge in the groups that allow all access
  const clusterAllowedGroups = new Array<string>().concat(
    clusterAclDef.owners,
    ALL_CLUSTERS_MEMBERS,
  );
  const userAuthorized = isUserAuthorized(user, clusterAllowedGroups);

  const isClusterRestricted = RESTRICTED_CLUSTERS.includes(
    clusterName.toLowerCase(),
  );
  const isClusterUnrestricted =
    clusterAclDef.isShared ||
    UNRESTRICTED_CLUSTERS.includes(clusterName.toLowerCase());
  return (userAuthorized || isClusterUnrestricted) && !isClusterRestricted;
}

/**
 * Checks if the user's request allows access to a given cluster. Will throw a
 * `ClusterNotAuthorizedError` if the user isn't authorized.
 * @param user          The user info.
 * @param cluster       The cluster to access.
 * @param store         The store containing the app state.
 */
export function verifyUserCanAccessCluster(
  user: IRequestUserInfo,
  cluster: IClusterDefinition,
): void {
  if (!canUserAccessCluster(user, cluster)) {
    throw new ClusterNotAuthorizedError(user.email, cluster);
  }
}

/**
 * Checks to see if a user is authorized to access a given entity.
 * @param user              The user info.
 * @param cluster           The cluster that owns the entity in question.
 * @param entityType        The type of entity.
 * @param entityName        The name of the entity.
 * @param useLocalCacheOnly Flag to indicate if the currently cached value must be used.
 *                          If not present in the cache, no network request will be made.
 *                          Defaults to false (use the cache if present, but fallback to network).
 */
async function canUserAccessEntity(
  user: IRequestUserInfo,
  cluster: IClusterDefinition,
  entityType: EntityType,
  entityName: string,
  useLocalCacheOnly = false,
): Promise<boolean> {
  const { ALL_ENTITY_MEMBERS } = getConfig();

  verifyUserCanAccessCluster(user, cluster);
  if (!isClusterShared(cluster.name)) {
    return true;
  }
  const ownership = await getEntityOwnership(
    cluster.name,
    cluster.env,
    entityType,
    entityName,
    useLocalCacheOnly,
  );
  const owners = ownership?.owners ?? [];
  const entityAllowedGroups = new Array<string>().concat(
    owners,
    ALL_ENTITY_MEMBERS,
  );
  return isUserAuthorized(user, entityAllowedGroups);
}

/**
 * Verifies that a user has access to the given entity. If the user does not have access,
 * this will throw an `EntityNotAuthorizedError`.
 * @param user              The user's info.
 * @param cluster           The cluster that owns the entity in question.
 * @param entityType        The type of entity.
 * @param entityName        The name of the entity.
 * @param useLocalCacheOnly Flag to indicate if the currently cached value must be used.
 *                          If not present in the cache, no network request will be made.
 *                          Defaults to false (use the cache if present, but fallback to network).
 */
export async function verifyUserAccessEntity(
  user: IRequestUserInfo,
  cluster: IClusterDefinition,
  entityType: EntityType,
  entityName: string,
  useLocalCacheOnly = false,
): Promise<void> {
  try {
    const canAccess = await canUserAccessEntity(
      user,
      cluster,
      entityType,
      entityName,
      useLocalCacheOnly,
    );
    if (!canAccess) {
      throw new EntityNotAuthorizedError(cluster, entityType, entityName);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Convenience method for filtering a list of entity names (of the same type) down to just the
 * ones the given user is permitted to access.
 * @param user        The user's info.
 * @param entityTypes The type of all the given entities.
 * @param entityNames The unique names of each of the entities.
 */
export async function filterAccessibleEntities(
  user: IRequestUserInfo,
  cluster: IClusterDefinition,
  entityTypes: EntityType,
  entityNames: string[],
): Promise<Set<string>> {
  // refresh the cache, then check access using the current local cache
  await getEntityAccessControlCache().refresh();
  const access = await Promise.all(
    entityNames.map(
      async (entityName) =>
        await canUserAccessEntity(user, cluster, entityTypes, entityName, true),
    ),
  );
  return new Set(entityNames.filter((name, index) => access[index]));
}

function getClusterAclDef(clusterName: string): IClusterOwnership | undefined {
  const { accessControl } = getStore();
  const clusterAclMap = accessControl.clusterAclMap;
  if (!clusterAclMap) {
    throw new ClusterAclsNotLoadedError(clusterName);
  }
  return clusterAclMap[clusterName.toLowerCase()] || undefined;
}

/**
 * Fetches any defined entity ownership information for the specified cluster, type, and name.
 */
async function getEntityOwnership(
  clusterName: string,
  env: string,
  entityType: EntityType,
  entityName: string,
  useLocalCacheOnly: boolean,
): Promise<IEntityOwnership | undefined> {
  const cache = getEntityAccessControlCache();
  const entity = useLocalCacheOnly
    ? await cache.getIfPresent(clusterName, env, entityType, entityName)
    : await cache.get(clusterName, env, entityType, entityName);
  return entity;
}
