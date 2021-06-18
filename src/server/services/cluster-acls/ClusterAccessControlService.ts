import { getConfig } from '@/config/configuration';
import setupLogger from '@/config/logger';
import ClusterAccessControlProvider from '@/services/cluster-acls/providers/ClusterAccessControlProvider';
import { IClusterDefinition } from '@/typings/typings';
import { EventEmitter } from 'events';

const { CLUSTER_ACCESS_CONTROL_ENABLED } = getConfig();

const logger = setupLogger(module);

const DEFAULT_POLL_INTERVAL = 60 * 1000;
const ERROR_POLL_INTERVAL = 30 * 1000;

interface IDataAccessControlService {
  on(event: 'error', listener: (name: string) => void): this;
  on(
    event: 'loaded',
    listener: (clusterAccessList: IClusterDefinition[]) => void,
  ): this;
}

export default class ClusterAccessControlService extends EventEmitter
  implements IDataAccessControlService {
  private provider: ClusterAccessControlProvider | undefined = undefined;
  private timeoutId: NodeJS.Timer | undefined = undefined;

  constructor(readonly pollInterval = DEFAULT_POLL_INTERVAL) {
    super();
  }

  /**
   * Specifies the provider to use responsible for fetching ACL information.
   * @param provider        Subclass of DataAccessControlProvider.
   */
  public use(provider: ClusterAccessControlProvider): void {
    this.provider = provider;
  }

  public start(): Promise<void> {
    if (!this.provider) {
      throw new Error(
        'provider has not been set. see use() method for details.',
      );
    }
    if (!CLUSTER_ACCESS_CONTROL_ENABLED) {
      logger.warn('cluster ACL provider is disabled');
      this.emit('loaded', {});
      return Promise.resolve();
    }
    return this.pollClusters();
  }

  public async refresh(): Promise<void> {
    if (!this.provider) {
      throw new Error(
        'provider has not been set. see use() method for details.',
      );
    }
    await this.pollClusters();
  }

  private async pollClusters() {
    logger.debug('retrieving ACL information...');

    try {
      if (!this.provider) {
        throw new Error(
          'provider has not been set. see use() method for details.',
        );
      }
      const clusterACL = await this.provider.getClusterAccessControl({});
      this.emit('loaded', clusterACL);
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(
        this.pollClusters.bind(this),
        this.pollInterval,
      );
    } catch (err) {
      this.emit('error', err);
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(
        this.pollClusters.bind(this),
        ERROR_POLL_INTERVAL,
      );
    }
  }
}
