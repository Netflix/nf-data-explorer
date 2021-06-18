import { getConfig } from '@/config/configuration';
import { ICassandraFeatureMap } from '@/services/datastores/cassandra/typings/cassandra';
import { Router } from 'express';

const {
  CASSANDRA_REQUIRE_METRICS_FOR_DESTRUCTIVE_OPERATIONS,
  CASSANDRA_METRICS_SUPPORT,
  CASSANDRA_ALLOW_DROP_TABLE,
  CASSANDRA_ALLOW_TRUNCATE_TABLE,
  CASSANDRA_ENVIRONMENTS_ALLOWING_DESTRUCTIVE_OPERATIONS,
} = getConfig();

const router = Router();

router.get('/', (_req, res) => {
  const featureMap: ICassandraFeatureMap = {
    metrics: CASSANDRA_METRICS_SUPPORT,
    metricsRequiredForDestructiveOperations: CASSANDRA_REQUIRE_METRICS_FOR_DESTRUCTIVE_OPERATIONS,
    allowDrop: CASSANDRA_ALLOW_DROP_TABLE,
    allowTruncate: CASSANDRA_ALLOW_TRUNCATE_TABLE,
    envsAllowingDestructiveOperations: CASSANDRA_ENVIRONMENTS_ALLOWING_DESTRUCTIVE_OPERATIONS,
  };
  res.json(featureMap);
});

export default router;
