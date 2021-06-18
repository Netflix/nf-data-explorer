import { IClusterDefinition } from '@/typings/typings';
import {
  ICassMetricsKeyspaceUsage,
  ICassMetricsTableUsage,
} from '../../../typings/cassandra';
import { ICassandraMetricsProvider } from './ICassandraMetricsProvider';

export default class CustomCassandraMetricsProvider
  implements ICassandraMetricsProvider {
  public async getClusterKeyspacesMetrics(
    _cluster: IClusterDefinition,
  ): Promise<ICassMetricsKeyspaceUsage[]> {
    throw new Error(
      'CustomCassandraMetricsProvider must implement getClusterKeyspacesMetrics()',
    );
  }

  public async getKeyspaceTablesMetrics(
    _cluster: IClusterDefinition,
    _keyspace: string,
    _range: 'day' | 'week',
    _step: 'day' | 'hour',
  ): Promise<ICassMetricsTableUsage[]> {
    throw new Error(
      'CustomCassandraMetricsProvider must implement getKeyspaceTablesMetrics()',
    );
  }

  public async getTableMetrics(
    _cluster: IClusterDefinition,
    _keyspace: string,
    _table: string,
    _range: 'day' | 'week',
    _step: 'day' | 'hour',
  ): Promise<ICassMetricsTableUsage> {
    throw new Error(
      'CustomCassandraMetricsProvider must implement getTableMetrics()',
    );
  }
}
