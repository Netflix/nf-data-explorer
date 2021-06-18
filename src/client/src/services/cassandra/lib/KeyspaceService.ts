import { getClient } from '@/services/BaseService';
import { handleServiceError } from '@/utils/service-utils';
import {
  IKeyspace,
  IKeyspaceReplication,
  IUserDefinedType,
} from '@cassandratypes/cassandra';

export async function fetchKeyspaces(cluster: string): Promise<IKeyspace[]> {
  try {
    const resp = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces`,
    );
    return resp.data as IKeyspace[];
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function fetchKeyspace(
  cluster: string,
  keyspace: string,
): Promise<IKeyspace> {
  try {
    const resp = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}`,
    );
    return resp.data as IKeyspace;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function fetchDataTypes(
  cluster: string,
  keyspace: string,
): Promise<{ standard: string[]; user: IUserDefinedType[] }> {
  try {
    const result = await getClient().get(
      `REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/types`,
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function createKeyspace(
  cluster: string,
  keyspace: string,
  datacenters: IKeyspaceReplication,
  owners: string[],
): Promise<any> {
  try {
    const result = await getClient().post(
      `REST/datastores/cassandra/clusters/${cluster}/keyspaces`,
      {
        name: keyspace,
        datacenters,
        owners,
      },
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}
