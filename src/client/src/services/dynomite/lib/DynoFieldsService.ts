import { getClient } from '@/services/BaseService';
import { IDynoCollectionKeyValue } from '@dynomitetypes/dynomite';

export async function addKeyFields(
  clusterName: string,
  keyName: string,
  keyType: string,
  values: IDynoCollectionKeyValue[],
): Promise<any> {
  const result = await getClient().post(
    `/REST/datastores/dynomite/clusters/${clusterName}/fields/${keyName}`,
    {
      type: keyType,
      values,
    },
  );
  return result.data;
}

export async function deleteKeyFields(
  clusterName: string,
  keyName: string,
  keyType: string,
  values: IDynoCollectionKeyValue[],
): Promise<any> {
  const result = await getClient().delete(
    `/REST/datastores/dynomite/clusters/${clusterName}/fields/${keyName}`,
    {
      data: {
        type: keyType,
        values,
      },
    },
  );
  return result.data;
}

export async function updateKeyFields(
  clusterName: string,
  keyName: string,
  keyType: string,
  values: IDynoCollectionKeyValue[],
): Promise<any> {
  const result = await getClient().put(
    `/REST/datastores/dynomite/clusters/${clusterName}/fields/${keyName}`,
    {
      type: keyType,
      values,
    },
  );
  return result.data;
}
