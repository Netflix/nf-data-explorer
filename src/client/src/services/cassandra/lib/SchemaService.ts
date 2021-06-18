import { getClient } from '@/services/BaseService';
import { IClusterSchemaColumn } from '@cassandratypes/cassandra';

export async function fetchSchema(
  cluster: string,
): Promise<IClusterSchemaColumn[]> {
  const result = await getClient().get(
    `/REST/datastores/cassandra/clusters/${cluster}/schema`,
  );
  return result.data;
}
