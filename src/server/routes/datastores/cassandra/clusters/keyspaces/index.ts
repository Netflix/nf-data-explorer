import setupLogger from '@/config/logger';
import {
  getEntityAccessControlCache,
  getEntityAccessControlService,
} from '@/config/services';
import EntityMissingAclOwners from '@/model/errors/EntityMissingAclOwners';
import tables from '@/routes/datastores/cassandra/clusters/keyspaces/tables';
import types from '@/routes/datastores/cassandra/clusters/keyspaces/types';
import { EntityType } from '@/typings/enums';
import { verifyUserAccessEntity } from '@/utils/acl-utils';
import { getEnv, isClusterShared } from '@/utils/app-utils';
import { getCassandraAccess } from '@/utils/cde-utils';
import { Request, Router } from 'express';

const logger = setupLogger(module);

const router = Router();

/**
 * Fetch all keyspaces.
 */
router.get('/', async (req: Request, res, next) => {
  logger.info('fetching all keyspaces', req);
  try {
    const allKeyspaces = await req.cassandraApi.getKeyspaces();
    const clusterAccess = await getCassandraAccess(
      req.user,
      req.cluster,
      allKeyspaces,
    );
    if (clusterAccess.isShared) {
      const userKeyspaceNames = clusterAccess.userKeyspaceNames;
      res.json(
        allKeyspaces.filter((keyspace) => userKeyspaceNames.has(keyspace.name)),
      );
    } else {
      res.json(allKeyspaces);
    }
  } catch (err) {
    next(err);
  }
});

/**
 * Creates a new keyspace. Expects POST body to include:
 *  {
 *      "name": "keyspace-name",
 *      "datacenters": {
 *          "us-east": 2,
 *          "eu-west": 2
 *      },
 *      "owners": ["jack@netflix.com", "jill@netflix.com"]
 *  }
 */
router.post('/', async (req: Request, res, next) => {
  const { name: keyspaceName, owners = [], datacenters = {} } = req.body;
  logger.info(`creating new keyspace: "${keyspaceName}"`, req);

  const cluster = req.cluster.name;
  const env = getEnv(req.app);
  const type = EntityType.KEYSPACE;
  const isShared = isClusterShared(cluster);
  if (isShared && owners.length === 0) {
    throw new EntityMissingAclOwners(cluster, type, keyspaceName);
  }

  let createKeyspaceResult;
  try {
    createKeyspaceResult = await req.cassandraApi.createKeyspace(
      keyspaceName,
      datacenters,
    );
  } catch (err) {
    return next(err);
  }

  // if the cluster is shared, then update entity ownership information
  if (isShared) {
    try {
      const entityAccessControlService = getEntityAccessControlService();
      await entityAccessControlService.setEntityOwners(
        cluster,
        env,
        type,
        keyspaceName,
        owners,
      );
    } catch (err) {
      return next(err);
    }
  }

  // refresh the cache of cluster/entities to ensure the user has access to the newly created keyspace
  getEntityAccessControlCache().refresh();

  res.json(createKeyspaceResult);
});

router.param('keyspace', async (req: Request, res, next, keyspaceName) => {
  try {
    // attempt to fetch the keyspace (throws if it cannot be found).
    await req.cassandraApi.getKeyspace(keyspaceName);
    await verifyUserAccessEntity(
      req.user,
      req.cluster,
      EntityType.KEYSPACE,
      keyspaceName,
      false,
    );
    req.keyspaceName = keyspaceName;
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Fetches a keyspace by name. Note, keyspaces are case-sensitive.
 */
router.get('/:keyspace', async (req: Request, res, next) => {
  logger.info(`fetching keyspace: "${req.keyspaceName}"`, req);
  try {
    const keyspace = await req.cassandraApi.getKeyspace(req.keyspaceName);
    res.json(keyspace);
  } catch (err) {
    next(err);
  }
});

router.use('/:keyspace/tables', tables);
router.use('/:keyspace/types', types);

export default router;
