import BaseDiscoveryProvider from '@/services/discovery/providers/BaseDiscoveryProvider';
import { EventEmitter } from 'events';

/**
 * DiscoveryService interface to be implemented by subclasses.
 *
 * Subclasses can provide environment specific implementations. For instance,
 * an implementation could poll a REST endpoint to discover the list of services
 * while another implementation could watch a local file for changes.
 *
 * Once the clusters are set, the service will emit a 'loaded' event that subscribers
 * can listen to for updates. Implementors are free to implement their own polling
 * interval or push/pull strategy.
 *
 * @event loaded-clusters When clusters have been loaded successfully.
 * @event loaded-environments When the list of environments have been loaded successfully.
 * @event loaded-regions When the list of regions have been loaded successfully.
 * @event error If an error was encountered while discovering.
 *
 * @abstract
 */
export default class DiscoveryService extends EventEmitter {
  constructor(readonly provider: BaseDiscoveryProvider) {
    super();
    if (!this.provider) {
      throw new Error('DiscoveryProvider must be provided.');
    }
    this.setupListeners();
  }

  private setupListeners() {
    this.provider.on('loaded-clusters', (clusters) => {
      this.emit('loaded-clusters', clusters);
    });
    this.provider.on('error', (error) => {
      this.emit('error', error);
    });
    this.provider.on('loaded-environments', (environments) => {
      this.emit('loaded-environments', environments);
    });
    this.provider.on('loaded-regions', (regions) => {
      this.emit('loaded-regions', regions);
    });
  }

  /**
   * Initiates loading of the clusters. Users of this API should listen for the
   * 'loaded-*' events since clusters may be loaded incrementally or on a timer/interval.
   * If clusters fail to load at any point, an 'error' event will be fired. It is the callers
   * responsibility to handle this error appropriately.
   */
  public start(): void {
    this.provider.start();
  }
}
