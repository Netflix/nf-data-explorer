import { Client } from 'cassandra-driver';

/**
 * Checks if the current client's connection is version 3. Assumes the client is already connected.
 * @return True if the connection is to a CQL 3.x system.
 */
export function isVersion3(client: Client): boolean {
  return getVersion(client).startsWith('3.');
}

export function getVersion(client: Client): string {
  return client.controlConnection.host.cassandraVersion;
}
