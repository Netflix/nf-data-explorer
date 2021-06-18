import { getClient } from '@/services/BaseService';
import { handleServiceError } from '@/utils/service-utils';
import { IDatacenter, IClusterInfo } from '@cassandratypes/cassandra';

export async function fetchDatacenters(
  cluster: string,
): Promise<IDatacenter[]> {
  try {
    const result = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/datacenters`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function fetchClusterInfo(cluster: string): Promise<IClusterInfo> {
  try {
    const result = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/info`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}
