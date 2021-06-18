import { getClient } from '@/services/BaseService';
import { ITable } from '@/typings/store';
import { handleServiceError } from '@/utils/service-utils';
import { ICreateTableOptions, ITableSchema } from '@cassandratypes/cassandra';

export async function fetchKeyspaceTables(
  cluster: string,
  keyspace: string,
): Promise<ITable[]> {
  try {
    const resp = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables`,
    );
    return resp.data as ITable[];
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function fetchTable(
  cluster: string,
  keyspace: string,
  table: string,
): Promise<ITableSchema> {
  try {
    const resp = await getClient().get(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables/${table}`,
    );
    return resp.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function createTable(
  cluster: string,
  keyspace: string,
  options: ICreateTableOptions,
): Promise<any> {
  try {
    const resp = await getClient().post(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables`,
      options,
    );
    return resp.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function createTableAdvanced(
  cluster: string,
  keyspace: string,
  table: string,
  createStatement: string,
): Promise<any> {
  try {
    const resp = await getClient().post(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables`,
      {
        table,
        createStatement,
      },
    );
    return resp.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function previewSchema(
  cluster: string,
  keyspace: string,
  options: ICreateTableOptions,
): Promise<any> {
  try {
    const resp = await getClient().post(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables?preview`,
      options,
    );
    return resp.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function dropTable(
  cluster: string,
  keyspace: string,
  table: string,
): Promise<any> {
  try {
    const resp = await getClient().delete(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables/${table}`,
    );
    return resp.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function truncateTable(
  cluster: string,
  keyspace: string,
  table: string,
): Promise<any> {
  try {
    const resp = await getClient().delete(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables/${table}/truncate`,
    );
    return resp.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}
