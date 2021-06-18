import { getClient } from '@/services/BaseService';
import {
  getFilenameFromContentDisposition,
  triggerDownload,
} from '@/utils/download-utils';
import { handleServiceError } from '@/utils/service-utils';
import {
  CassandraExportFormat,
  IKeyResult,
  IKeyQuery,
  IRowDetails,
  TruncationOption,
} from '@cassandratypes/cassandra';
import { AxiosResponse } from 'axios';
import numeral from 'numeral';

export * from './lib/ClusterService';
export * from './lib/FeatureService';
export * from './lib/KeyspaceService';
export * from './lib/MetricsService';
export * from './lib/QueryService';
export * from './lib/SchemaService';
export * from './lib/TablesService';
export * from './lib/UsageService';

function getKeys(
  cluster: string,
  keyspace: string,
  table: string,
  filter: IKeyQuery,
  pageState?: string,
  options?: {
    truncate?: TruncationOption;
    format?: CassandraExportFormat;
    generateFile?: boolean;
  },
): Promise<AxiosResponse<any>> {
  const nonNullFilter: IKeyQuery = JSON.parse(JSON.stringify(filter));
  Object.entries(nonNullFilter.primaryKey).forEach(([key, details]) => {
    const { value } = details;
    if (value === undefined) {
      delete nonNullFilter.primaryKey[key];
    }
  });

  const qs = new URLSearchParams();
  if (pageState) {
    qs.set('pageState', pageState);
  }
  if (options) {
    const { format, generateFile, truncate } = options;
    if (format) {
      qs.set('format', format);
      qs.set('generateFile', `${!!generateFile}`);
    }
    if (truncate) {
      qs.set('truncate', truncate);
    }
  }
  return getClient().post(
    `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables/${table}/keys?${qs}`,
    nonNullFilter,
  );
}

export async function getKeyResults(
  cluster: string,
  keyspace: string,
  table: string,
  filter: IKeyQuery,
  pageState?: string,
  options?: {
    truncate?: TruncationOption;
  },
): Promise<IKeyResult> {
  try {
    const result = await getKeys(cluster, keyspace, table, filter, pageState, {
      truncate: options && options.truncate,
    });
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function getInsertStatements(
  cluster: string,
  keyspace: string,
  table: string,
  filter: IKeyQuery,
  pageState?: string,
): Promise<{
  records: string[];
}> {
  try {
    const result = await getKeys(cluster, keyspace, table, filter, pageState, {
      format: 'cql',
    });
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export interface IDownloadResult {
  filename: string;
  results: string;
}

export async function downloadResultSet(
  format: CassandraExportFormat,
  cluster: string,
  keyspace: string,
  table: string,
  filter: IKeyQuery,
  pageState?: string,
): Promise<IDownloadResult> {
  try {
    const result = await getKeys(cluster, keyspace, table, filter, pageState, {
      format,
      generateFile: true,
    });
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

export interface IBlobDownload {
  message?: string | undefined;
  status: number;
  type: 'download' | 'hex' | 'none';
}

export async function downloadBlob(
  cluster: string,
  keyspace: string,
  table: string,
  primaryKey: any,
  blobColumn: string,
  useHex = false,
): Promise<IBlobDownload> {
  let popup: Window | null = null;
  if (useHex) {
    // need to open the popup first in response to the user's action or it will get blocked
    popup = window.open(undefined, '_blank');
  }

  // fetch the content
  const result = await getClient().post(
    `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables/${table}/binary?hex=${useHex}`,
    { primaryKey, columnName: blobColumn },
    { responseType: 'blob' },
  );

  const { data, headers, status } = result;

  if (status === 204) {
    if (useHex && popup) {
      popup.close();
    }
    return { status: 204, type: 'none' };
  }

  const {
    'content-disposition': contentDisposition,
    'content-length': contentLength,
  }: { 'content-disposition': string; 'content-length': string } = headers;

  const filename = getFilenameFromContentDisposition(contentDisposition);
  const url = URL.createObjectURL(data);

  let message: string | undefined;
  if (useHex && popup) {
    // avoid trying to render excessively large hex payloads
    if (parseInt(contentLength, 10) < 10 * 1024 * 1024) {
      popup.location.href = url;
      return { status: 200, type: 'hex' };
    } else {
      const size = numeral(contentLength).format('0.0b');
      message = `HEX contain is too large (${size}) to display. Content was downloaded instead.`;
      popup.close();
    }
  } else {
    message = undefined;
  }

  triggerDownload(url, filename);
  return { status: 200, message, type: 'download' };
}

export async function updateRecord(
  cluster: string,
  keyspace: string,
  table: string,
  primaryKeyQuery: IKeyQuery,
  rowDetails: IRowDetails,
): Promise<void> {
  const validFields: IRowDetails = {};
  // exclude undefined values which may indicate they were not retrievable in the first place.
  // avoid sending these values to the server or they will be written as nulls.
  for (const [key, details] of Object.entries(rowDetails)) {
    const { value } = details;
    if (value !== undefined) {
      validFields[key] = details;
    }
  }
  try {
    const result = await getClient().put(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables/${table}/keys`,
      {
        primaryKeyQuery,
        fields: validFields,
      },
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function insertRecord(
  cluster: string,
  keyspace: string,
  table: string,
  rowDetails: IRowDetails,
): Promise<void> {
  const formData = new FormData();
  for (const [key, details] of Object.entries(rowDetails)) {
    if (details !== undefined) {
      const { options, value } = details;
      if (value !== undefined) {
        formData.append(key, value);
        if (options.encoding) {
          formData.append(`${key}.encoding`, options.encoding);
        }
      }
    }
  }

  try {
    const result = await getClient().post(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables/${table}/keys/create`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}

export async function deleteRecord(
  cluster: string,
  keyspace: string,
  table: string,
  primaryKeyQuery: IKeyQuery,
) {
  try {
    const result = await getClient().delete(
      `/REST/datastores/cassandra/clusters/${cluster}/keyspaces/${keyspace}/tables/${table}/keys`,
      {
        data: {
          primaryKeyQuery,
        },
      },
    );
    return result.data;
  } catch (err) {
    throw handleServiceError(err);
  }
}
