import { getConfig } from '@/config/configuration';
import { auth, ClientOptions } from 'cassandra-driver';
import { ICassandraClientOptionsProvider } from './ICassandraClientOptionsProvider';
import { ICassandraConnectParams } from '../../../typings/cassandra';

const {
  CASSANDRA_BASE_AUTH_PROVIDER_USERNAME,
  CASSANDRA_BASE_AUTH_PROVIDER_PASSWORD,
} = getConfig();

export default class LocalCassandraClientOptionsProvider
  implements ICassandraClientOptionsProvider {
  public getLocalDatacenter(_region: string): string {
    return 'datacenter1';
  }

  public getAuthProvider(
    _username: string | undefined,
    _password: string | undefined,
  ): auth.PlainTextAuthProvider | undefined {
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

  public getPolicies(_region: string): ClientOptions['policies'] {
    return undefined;
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
