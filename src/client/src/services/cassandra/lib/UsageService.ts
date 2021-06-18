import { getClient } from '@/services/BaseService';
import { handleServiceError } from '@/utils/service-utils';

export async function fetchKeyspaceUsage(
  cluster: string,
  keyspace: string,
): Promise<any> {
  try {
    const resp = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/usage`,
    );
    return resp.data as any;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function fetchTableUsage(
  cluster: string,
  keyspace: string,
  table: string,
): Promise<any> {
  try {
    const resp = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables/${table}/usage`,
    );
    return resp.data as any;
  } catch (err) {
    throw handleServiceError(err);
  }
}
