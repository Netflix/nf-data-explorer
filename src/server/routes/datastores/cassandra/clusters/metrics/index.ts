import { getConfig } from '@/config/configuration';
import FeatureDisabledError from '@/model/errors/FeatureDisabledError';
import { ICassandraMetricsProvider } from '@/services/datastores/cassandra/lib/providers/metrics/ICassandraMetricsProvider';
import {
  ICassMetricsKeyspaceUsage,
  ICassMetricsTableUsage,
} from '@/services/datastores/cassandra/typings/cassandra';
import { loadClass } from '@/utils/class-loader-utils';
import { Request, Router } from 'express';

const { CASSANDRA_METRICS_PROVIDER, CASSANDRA_METRICS_SUPPORT } = getConfig();

const router = Router();

async function getCassandraMetricsProvider() {
  const providerName = CASSANDRA_METRICS_PROVIDER;
  if (!providerName) {
    return undefined;
  }
  const ProviderClass = await loadClass<new () => ICassandraMetricsProvider>(
    `@/services/datastores/cassandra/lib/providers/metrics/${providerName}`,
  );
  const provider = new ProviderClass();
  return provider;
}

router.use((_req, _res, next) => {
  if (CASSANDRA_METRICS_SUPPORT === false) {
    throw new FeatureDisabledError('metrics');
  }
  next();
});

router.get('/keyspaces', async (req: Request, res, next) => {
  try {
    const metricsProvider = await getCassandraMetricsProvider();
    let result = new Array<ICassMetricsKeyspaceUsage>();
    if (metricsProvider) {
      result = await metricsProvider.getClusterKeyspacesMetrics(req.cluster);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/keyspaces/:keyspace/tables', async (req: Request, res, next) => {
  try {
    const range = (req.query.range || 'week') as 'week' | 'day';
    const step = (req.query.step || 'day') as 'day' | 'hour';
    const metricsProvider = await getCassandraMetricsProvider();
    let result = new Array<ICassMetricsTableUsage>();
    if (metricsProvider) {
      result = await metricsProvider.getKeyspaceTablesMetrics(
        req.cluster,
        req.params.keyspace,
        range,
        step,
      );
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get(
  '/keyspaces/:keyspace/tables/:table',
  async (req: Request, res, next) => {
    try {
      const range = (req.query.range || 'week') as 'week' | 'day';
      const step = (req.query.step || 'day') as 'day' | 'hour';
      const metricsProvider = await getCassandraMetricsProvider();
      let result: ICassMetricsTableUsage | undefined = undefined;
      if (metricsProvider) {
        result = await metricsProvider.getTableMetrics(
          req.cluster,
          req.params.keyspace,
          req.params.table,
          range,
          step,
        );
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
