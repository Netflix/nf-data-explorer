import { getClient } from '@/services/BaseService';
import { handleServiceError } from '@/utils/service-utils';
import {
  ICassMetricsKeyspaceUsage,
  ICassMetricsTableUsage,
} from '@cassandratypes/cassandra';

export async function getClusterKeyspacesMetrics(
  cluster: string,
): Promise<ICassMetricsKeyspaceUsage[]> {
  try {
    const result = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/metrics/keyspaces`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function getKeyspaceTableMetrics(
  cluster: string,
  keyspace: string,
  range: 'week' | 'day',
  step: 'day' | 'hour',
): Promise<ICassMetricsTableUsage[]> {
  try {
    const result = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/metrics/keyspaces/${keyspace}/tables?range=${range}&step=${step}`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function getTableMetrics(
  cluster: string,
  keyspace: string,
  table: string,
  range: 'week' | 'day',
  step: 'day' | 'hour',
): Promise<ICassMetricsTableUsage> {
  try {
    const result = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/metrics/keyspaces/${keyspace}/tables/${table}?range=${range}&step=${step}`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}
