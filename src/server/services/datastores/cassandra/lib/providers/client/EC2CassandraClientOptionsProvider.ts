import { getConfig } from '@/config/configuration';
import { auth, ClientOptions, policies } from 'cassandra-driver';
import NoRetryPolicy from '../../policies/NoRetryPolicy';
import { ICassandraClientOptionsProvider } from './ICassandraClientOptionsProvider';
import { ICassandraConnectParams } from '../../../typings/cassandra';

const {
  CASSANDRA_BASE_AUTH_PROVIDER_USERNAME,
  CASSANDRA_BASE_AUTH_PROVIDER_PASSWORD,
} = getConfig();

export default class EC2CassandraClientOptionsProvider
  implements ICassandraClientOptionsProvider {
  public getLocalDatacenter(region: string): string {
    return region;
  }

  public getAuthProvider(
    _username: string | undefined,
    _password: string | undefined,
  ): auth.AuthProvider | undefined {
    if (
      CASSANDRA_BASE_AUTH_PROVIDER_USERNAME === undefined ||
      CASSANDRA_BASE_AUTH_PROVIDER_PASSWORD === undefined
    ) {
      return undefined;
    }
    // here we use the static values in the base configuration.
    return new auth.PlainTextAuthProvider(
      CASSANDRA_BASE_AUTH_PROVIDER_USERNAME,
      CASSANDRA_BASE_AUTH_PROVIDER_PASSWORD,
    );
  }

  public getPolicies(region: string): ClientOptions['policies'] {
    return {
      loadBalancing: new policies.loadBalancing.DCAwareRoundRobinPolicy(region),
      addressResolution: new policies.addressResolution.EC2MultiRegionTranslator(),
      retry: new NoRetryPolicy(),
    };
  }

  public getPoolingOptions(): ClientOptions['pooling'] {
    return undefined;
  }

  public getSocketOptions(): ClientOptions['socketOptions'] {
    return undefined;
  }

  public async getSslOptions(
    _params: ICassandraConnectParams,
  ): Promise<ClientOptions['sslOptions']> {
    return undefined;
  }
}
