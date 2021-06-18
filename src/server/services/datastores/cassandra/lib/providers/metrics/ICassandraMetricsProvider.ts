import { IClusterDefinition } from '@/typings/typings';
import {
  ICassMetricsKeyspaceUsage,
  ICassMetricsTableUsage,
} from '../../../typings/cassandra';

export interface ICassandraMetricsProvider {
  getClusterKeyspacesMetrics: (
    cluster: IClusterDefinition,
  ) => Promise<ICassMetricsKeyspaceUsage[]>;

  getKeyspaceTablesMetrics: (
    cluster: IClusterDefinition,
    keyspace: string,
    range: 'day' | 'week',
    step: 'hour' | 'day',
  ) => Promise<ICassMetricsTableUsage[]>;

  getTableMetrics: (
    cluster: IClusterDefinition,
    keyspace: string,
    table: string,
    range: 'day' | 'week',
    step: 'hour' | 'day',
  ) => Promise<ICassMetricsTableUsage | undefined>;
}
