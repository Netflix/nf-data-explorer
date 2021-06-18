import { auth, ClientOptions } from 'cassandra-driver';
import { ICassandraConnectParams } from '../../../typings/cassandra';

export interface ICassandraClientOptionsProvider {
  /**
   * Returns the name of the local datacenter.
   */
  getLocalDatacenter: (region: string) => string;

  /**
   * Returns a configured auth provider to use on each new connection to a Cassandra cluster.
   */
  getAuthProvider: (
    username: string | undefined,
    password: string | undefined,
  ) => auth.AuthProvider | undefined;

  /**
   * Returns any configured policies to be used on each new connection to a Cassandra cluster.
   */
  getPolicies: (region: string) => ClientOptions['policies'];

  /**
   * Returns any socket options to be used on each new connection to a Cassandra cluster.
   */
  getSocketOptions: () => ClientOptions['socketOptions'];

  /**
   * Returns any connection pooling options to be used on each new connection to a Cassandra cluster.
   */
  getPoolingOptions: () => ClientOptions['pooling'];

  /**
   * If SSL is required to connect to a given cluster then this should return the appropriate
   * sslOptions configuration. Returns a promise in case an asynchronous call is required to resolve
   * the value. Resolve with undefined if not using SSL.
   */
  getSslOptions: (
    params: ICassandraConnectParams,
  ) => Promise<ClientOptions['sslOptions']>;
}
