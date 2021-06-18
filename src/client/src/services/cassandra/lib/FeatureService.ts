import { getClient } from '@/services/BaseService';
import { handleServiceError } from '@/utils/service-utils';
import { ICassMetricsKeyspaceUsage } from '@cassandratypes/cassandra';

export async function getFeatures(): Promise<ICassMetricsKeyspaceUsage[]> {
  try {
    const result = await getClient().get('/REST/datastores/cassandra/features');
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}
