import { getClient } from '@/services/BaseService';
import { handleServiceError } from '@/utils/service-utils';

export async function getKeyCount(clusterName: string): Promise<number> {
  try {
    const result = await getClient().get(
      `/REST/datastores/dynomite/clusters/${clusterName}`,
    );
    const clusterInfo = result.data;
    return clusterInfo.totalKeys;
  } catch (err) {
    throw handleServiceError(err);
  }
}
