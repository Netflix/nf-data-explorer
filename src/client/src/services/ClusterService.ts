import { getClient } from '@/services/BaseService';
import { IClusterRegionSummary } from '@sharedtypes/typings';

export async function getClusters(): Promise<IClusterRegionSummary[]> {
  const resp = await getClient().get('/REST/datastores');
  if (resp.status === 204) {
    return [];
  }
  return resp.data;
}
