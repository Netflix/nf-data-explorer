import { getConfig } from '@/config/configuration';
import setupLogger from '@/config/logger';
import { IClusterDefinition, IInstanceDefinition } from '@/typings/typings';
import Redis from 'ioredis';

const { DYNOMITE_REDIS_PORT } = getConfig();

const logger = setupLogger(module);

export default class DynomiteCluster {
  private connections: Redis.Redis[];
  private hostConnectionMap: {
    [hostname: string]: Redis.Redis | null;
  };
  private instances: IInstanceDefinition[];

  /**
   * Creates a connection pool using the list of given instances. The instances
   * are expected to reside in the same region.
   * @param instances The list of instances.
   * @param connector The Connector to use.
   */
  constructor(readonly cluster: IClusterDefinition) {
    this.connections = [];
    this.instances = cluster.instances;

    // initialize the connection map
    this.hostConnectionMap = {};
    this.cluster.instances.forEach((instance) => {
      this.hostConnectionMap[instance.hostname] = null;
    });
  }

  /**
   * Fetches a non-specific connection from the pool. The implementation is free
   * to decide what instance to connect to. If you need to connect to a specific
   * instance, see getConnectionToHost()
   * @returns
   * @see getConnectionToHost(hostname)
   */
  public async getConnection(): Promise<Redis.Redis> {
    if (!this.instances || this.instances.length === 0) {
      throw new Error(
        'Unable to get connection. No instances are available in this pool',
      );
    }
    if (this.connections.length > 0) {
      return this.connections[0];
    }
    return this._connect(this.instances[0]);
  }

  public disconnect(): void {
    this.connections.forEach((conn) => conn.disconnect());
  }

  /**
   * Fetches a specific connection from the pool based on the host ID.
   * @param hostname    Name of the host to connect to.
   */
  public async getConnectionToHost(hostname: string): Promise<Redis.Redis> {
    const hostConnection = this.hostConnectionMap[hostname];
    if (hostConnection) {
      logger.debug(`using existing connection in the pool for: ${hostname}`);
      return hostConnection;
    }

    logger.debug(
      `no connection available for: ${hostname}. attempting to connect...`,
    );
    const instance = this.instances.find((inst) => inst.hostname === hostname);
    if (!instance) {
      throw new Error(
        `Could not find hostname "${hostname}" in the list of available instances`,
      );
    }
    return this._connect(instance);
  }

  public executeCommandInSingleZone(
    callback: (callback: Redis.Redis) => Promise<any>,
  ): Promise<any> {
    const zones = new Set(this.instances.map((instance) => instance.az));
    logger.debug(`executing command against the following instances: ${zones}`);
    const firstZone = zones.values().next().value;
    return this.executeCommandInZone(firstZone, callback);
  }

  public executeCommandOnAllInstances(callback: () => any): Promise<any> {
    return this._executeOnGivenInstances(this.instances, callback);
  }

  public getFirstRingMembers(): string[] {
    const members = this.getRingMembers();
    const firstAz = Object.keys(members)[0];
    logger.debug(`getFirstRingMembers firstAz: ${firstAz}`);
    return members[firstAz].map((instance) => instance.hostname);
  }

  /**
   * Executes a given callback against the given zone.
   * @param zone      The availability zone to run the command against.
   * @param callback  The callback to execute. The given callback will be called
   *                  with a single parameter "conn", the Connection for the instance.
   * @returns Returns a Promise that will be resolved with the result of the given callback.
   */
  private executeCommandInZone(
    zone: string,
    callback: (conn: Redis.Redis) => Promise<any>,
  ) {
    logger.debug(`executing command in zone: ${zone}`);
    const instancesInZone = this.instances.filter(
      (instance) => instance.az === zone,
    );
    if (instancesInZone.length === 0) {
      return Promise.reject(new Error(`No instances found in zone ${zone}`));
    }
    return this._executeOnGivenInstances(instancesInZone, callback);
  }

  /**
   * Executes the given callback against connections to each of the given instances.
   * @param instances   The list of instances to connect to.
   * @param callback    The callback function to execute against each of the connections.
   * @returns Returns a Promise that will be resolved with the result of calling
   *          each of the callbacks against each connection.
   */
  private _executeOnGivenInstances(
    instances: any[],
    callback: (conn: Redis.Redis) => Promise<any>,
  ): Promise<any> {
    logger.debug(
      `executing command against the following instances: ${JSON.stringify(
        instances,
      )}`,
    );
    return new Promise((resolve, reject) => {
      const connectionPromises = new Array<Promise<any>>();

      // ensure we have established connections to all hosts
      instances.forEach((instance) => {
        connectionPromises.push(this.getConnectionToHost(instance.hostname));
      });

      // once we have all the connections established
      Promise.all(connectionPromises)
        .then((connections) => {
          // execute the given callback on each connection
          const callbackPromises = connections.map((connection) =>
            callback(connection),
          );

          // once all the callbacks are complete, resolve the results
          Promise.all(callbackPromises).then(resolve).catch(reject);
        })
        .catch((err) => {
          logger.error(err);
          reject(err);
        });
    });
  }

  private getRingMembers() {
    const rings = {} as { [az: string]: IInstanceDefinition[] };
    this.instances.forEach((instance) => {
      const az = instance.az;
      let ringMembers = rings[az];
      if (!ringMembers) {
        ringMembers = [];
        rings[az] = ringMembers;
      }
      ringMembers.push(instance);
    });
    return rings;
  }

  /**
   * Helper for connecting to a given instance.
   * @param instance The instance to connect to.
   * @returns Returns a Promise that will resolve with the underlying connection.
   */
  private async _connect(instance: IInstanceDefinition): Promise<Redis.Redis> {
    try {
      const fqdn = `${instance.hostname} (${instance.ip}:8102)`;
      logger.debug(`connecting to dynomite: ${fqdn}`);

      const conn = new Redis({
        port: DYNOMITE_REDIS_PORT,
        host: instance.ip,
        retryStrategy: (times) => {
          if (times > 5) {
            logger.error(
              `Reached retry limit for connection: ${fqdn}. Removing connection from pool...`,
            );
            const index = this.connections.indexOf(conn);
            if (index >= 0) {
              this.connections.splice(index, 1);
            }
            return undefined;
          }
          const delayInMs = 500;
          return delayInMs * times;
        },
      });
      conn.on('error', (err) => {
        logger.error(`Redis connection error: ${fqdn}`);
        logger.debug(err);
        logger.debug(err.lastNodeError);
      });

      this.connections.push(conn);
      this.instances.forEach((inst) => {
        if (instance === inst) {
          this.hostConnectionMap[inst.hostname] = conn;
        }
      });

      logger.debug('got connection successfully');
      return conn;
    } catch (err) {
      logger.error(
        `Could not get a connection to instance: ${JSON.stringify(instance)}`,
      );
      throw err;
    }
  }
}
