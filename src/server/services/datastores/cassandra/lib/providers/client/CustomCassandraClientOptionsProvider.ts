import { ClientOptions, auth } from 'cassandra-driver';
import { ICassandraClientOptionsProvider } from './ICassandraClientOptionsProvider';
import { ICassandraConnectParams } from '../../../typings/cassandra';

export default class CustomCassandraClientOptionsProvider
  implements ICassandraClientOptionsProvider {
  public getLocalDatacenter(_region: string): string {
    throw new Error(
      'CustomCassandraClientOptionsProvider must implement getLocalDatacenter()',
    );
  }

  public getAuthProvider(
    _username: string | undefined,
    _password: string | undefined,
  ): auth.AuthProvider {
    throw new Error(
      'CustomCassandraClientOptionsProvider must implement getAuthProvider()',
    );
  }

  public getPolicies(_region: string): ClientOptions['policies'] {
    throw new Error(
      'CustomCassandraClientOptionsProvider must implement getPolicies()',
    );
  }

  public getPoolingOptions(): ClientOptions['pooling'] {
    throw new Error(
      'CustomCassandraClientOptionsProvider must implement getPolicies()',
    );
  }

  public getSocketOptions(): ClientOptions['socketOptions'] {
    throw new Error(
      'CustomCassandraClientOptionsProvider must implement getPolicies()',
    );
  }

  public async getSslOptions(
    _params: ICassandraConnectParams,
  ): Promise<ClientOptions['sslOptions']> {
    return undefined;
  }
}
