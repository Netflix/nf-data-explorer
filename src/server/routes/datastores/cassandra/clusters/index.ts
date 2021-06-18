import { getConfig } from '@/config/configuration';
import loggerFactory from '@/config/logger';
import { getExplorerCache } from '@/config/services';
import keyspaces from '@/routes/datastores/cassandra/clusters/keyspaces';
import metrics from '@/routes/datastores/cassandra/clusters/metrics';
import query from '@/routes/datastores/cassandra/clusters/query';
import { IExplorer } from '@/services/datastores/base/datastore';
import ClusterNotFoundError from '@/services/datastores/base/errors/ClusterNotFoundError';
import CassandraDatastoreService from '@/services/datastores/cassandra';
import CassandraExplorer from '@/services/datastores/cassandra/lib/CassandraExplorer';
import { ICassandraClientOptionsProvider } from '@/services/datastores/cassandra/lib/providers/client/ICassandraClientOptionsProvider';
import { ICassandraConnectParams } from '@/services/datastores/cassandra/typings/cassandra';
import { DatastoreType, EntityType } from '@/typings/enums';
import { IClusterDefinition } from '@/typings/typings';
import {
  filterAccessibleEntities,
  verifyUserCanAccessCluster,
} from '@/utils/acl-utils';
import {
  getCluster,
  getEnv,
  getRegion,
  isClusterShared,
} from '@/utils/app-utils';
import { loadClass } from '@/utils/class-loader-utils';
import { Request, Router } from 'express';

const logger = loggerFactory(module);

const router = Router();

const { CASSANDRA_CLIENT_OPTIONS_PROVIDER } = getConfig();

let cassandraDatastoreService: CassandraDatastoreService;

async function getCassandraDatastoreService() {
  if (!cassandraDatastoreService) {
    const providerName = CASSANDRA_CLIENT_OPTIONS_PROVIDER;
    logger.info(
      `setting up Cassandra datastore service using provider: ${providerName}`,
    );
    const ProviderClass = await loadClass<
      new () => ICassandraClientOptionsProvider
    >(`@/services/datastores/cassandra/lib/providers/client/${providerName}`);
    const provider = new ProviderClass();

    cassandraDatastoreService = new CassandraDatastoreService(provider);
  }
  return cassandraDatastoreService;
}

/**
 * Handles /:cluster parameters in the request. Responsible for fetching an existing connection or establishing a
 * new connection to the given cluster.
 */
router.param('cluster', async (req: Request, res, next, clusterName) => {
  if (!clusterName) {
    return res
      .status(400)
      .json({ message: 'clusterName must be provided in path param.' });
  }
  const datastoreType = DatastoreType.CASSANDRA;

  try {
    const region = getRegion(req.app);
    const env = getEnv(req.app);
    const cluster = getCluster(req.app, datastoreType, clusterName);
    if (!cluster) {
      throw new ClusterNotFoundError(clusterName, region, env);
    }
    req.datastoreType = datastoreType;
    req.cluster = cluster;

    verifyUserCanAccessCluster(req.user, req.cluster);
    const explorerCache = getExplorerCache();
    req.cassandraApi = (await explorerCache.getExplorer(
      datastoreType,
      clusterName,
      region,
      env,
      async (clusterDef: IClusterDefinition): Promise<IExplorer> => {
        const clusterDescription = `${clusterName}.${region}.${env}`;
        const service = await getCassandraDatastoreService();
        const params: ICassandraConnectParams = {
          clusterDescription,
          clusterName,
          env,
          instances: clusterDef.instances,
          region,
        };
        return service.connect(params);
      },
    )) as CassandraExplorer;
    return next();
  } catch (err) {
    return next(err);
  }
});

router.get('/:cluster/info', async (req: Request, res, next) => {
  try {
    const info = await req.cassandraApi.getClusterInfo();
    res.json(info);
  } catch (err) {
    next(err);
  }
});

router.get('/:cluster/datacenters', async (req: Request, res, next) => {
  try {
    const datacenters = await req.cassandraApi.getDatacenters();
    res.json(datacenters);
  } catch (err) {
    next(err);
  }
});

router.get('/:cluster/schema', async (req: Request, res, next) => {
  try {
    const schema = await req.cassandraApi.getClusterSchema();
    if (isClusterShared(req.cluster.name)) {
      const keyspaceNames = schema.map((schemaRow) => schemaRow.keyspace);
      const userKeyspaceSet = await filterAccessibleEntities(
        req.user,
        req.cluster,
        EntityType.KEYSPACE,
        keyspaceNames,
      );
      const userSchemas = schema.filter((schemaRow) =>
        userKeyspaceSet.has(schemaRow.keyspace),
      );
      res.json(userSchemas);
    } else {
      res.json(schema);
    }
  } catch (err) {
    next(err);
  }
});

router.use('/:cluster/keyspaces', keyspaces);
router.use('/:cluster/metrics', metrics);
router.use('/:cluster/query', query);

export default router;
