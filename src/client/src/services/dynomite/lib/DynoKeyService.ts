import { IKeyValue, IScanResult } from '@dynomitetypes/dynomite';
import { getClient } from '../../BaseService';
import { handleServiceError } from '@/utils/service-utils';

export async function getKey(
  clusterName: string,
  keyName: string,
): Promise<IKeyValue> {
  try {
    const result = await getClient().get(
      `/REST/datastores/dynomite/clusters/${clusterName}/keys/${keyName}`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function keyExists(
  clusterName: string,
  keyName: string,
): Promise<boolean> {
  try {
    await getClient().get(
      `/REST/datastores/dynomite/clusters/${clusterName}/keys/${keyName}?test`,
    );
    return true;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return false;
    }
    throw err;
  }
}

export async function scan(
  clusterName: string,
  query: string,
  cursor: string,
): Promise<IScanResult> {
  try {
    const params = new URLSearchParams();
    if (query) {
      params.set('match', query);
    }
    if (cursor) {
      params.set('cursor', cursor);
    }

    const result = await getClient().get(
      `/REST/datastores/dynomite/clusters/${clusterName}/keys?${params}`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function deleteKey(
  clusterName: string,
  keyName: string,
): Promise<void> {
  try {
    const result = await getClient().delete(
      `/REST/datastores/dynomite/clusters/${clusterName}/keys/${keyName}`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function createKey(
  clusterName: string,
  keyName: string,
  value: string,
): Promise<void> {
  try {
    const result = await getClient().post(
      `/REST/datastores/dynomite/clusters/${clusterName}/keys/${keyName}`,
      {
        value,
      },
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function updateKey(
  clusterName: string,
  keyName: string,
  value: string,
): Promise<void> {
  try {
    const result = await getClient().put(
      `/REST/datastores/dynomite/clusters/${clusterName}/keys/${keyName}`,
      {
        value,
      },
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function updateTtl(
  clusterName: string,
  keyName: string,
  ttl: number,
): Promise<void> {
  try {
    const query = new URLSearchParams();
    let ttlAction: 'persist' | 'expire' = 'persist';
    if (ttl > 0) {
      ttlAction = 'expire';
      query.set('ttl', ttl.toString());
    }
    const result = await getClient().put(
      `/REST/datastores/dynomite/clusters/${clusterName}/keys/${keyName}/${ttlAction}?${query}`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}
