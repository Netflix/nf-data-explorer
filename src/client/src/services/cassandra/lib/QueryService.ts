import { getClient } from '@/services/BaseService';
import { getFilenameFromContentDisposition } from '@/utils/download-utils';
import { handleServiceError } from '@/utils/service-utils';
import {
  CassandraExportFormat,
  IStatementResult,
  IKeyQueryOptions,
} from '@cassandratypes/cassandra';
import { IDownloadResult } from '../CassService';

export async function executeQuery(
  cluster: string,
  query: string,
  options: IKeyQueryOptions,
): Promise<IStatementResult> {
  try {
    const params = new URLSearchParams();
    params.set('truncate', 'all');
    const results = await getClient().post(
      `/REST/datastores/cassandra/clusters/${cluster}/query?${params}`,
      {
        query,
        options,
      },
    );
    return results.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function downloadQuery(
  format: CassandraExportFormat,
  cluster: string,
  query: string,
  options: IKeyQueryOptions,
): Promise<IDownloadResult> {
  try {
    const params = new URLSearchParams();
    params.set('generateFile', 'true');
    params.set('format', format);

    const result = await getClient().post(
      `/REST/datastores/cassandra/clusters/${cluster}/query?${params}`,
      {
        query,
        options,
      },
    );

    const { data, headers } = result;
    const filename = getFilenameFromContentDisposition(
      headers['content-disposition'],
      format === 'cql' ? 'insert.cql' : `download.${format}`,
    );
    return {
      filename,
      results: data,
    };
  } catch (err) {
    throw handleServiceError(err);
  }
}
