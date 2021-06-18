import { IClusterDefinition } from '@/typings/typings';
import { EventEmitter } from 'events';

export default abstract class BaseDiscoveryProvider extends EventEmitter {
  private clusterList: IClusterDefinition[] = [];
  private lastError: Error | undefined;
  private environmentList: string[] = [];
  private regionList: string[] = [];

  /**
   * Initiates loading of the clusters. Users of this API should listen for the
   * 'loaded-*' events since clusters may be loaded incrementally or on a timer/interval.
   * If clusters fail to load at any point, an 'error' event will be fired. It is the callers
   * responsibility to handle this error appropriately.
   */
  public start(): void {
    throw new Error('Implementors must implement start()');
  }

  /**
   * Fetches the current list of clusters. Note, clusters could be empty until
   * they are loaded. Clusters are loaded asynchonously. See the 'load'
   * method.
   */
  get clusters(): IClusterDefinition[] {
    return this.clusterList;
  }

  /**
   * Sets the list of discovered clusters. Will notify listeners by emitting a 'loaded-clusters' event.
   * @param clusters The array of clusters.
   */
  set clusters(clusters: IClusterDefinition[]) {
    this.clusterList = clusters;
    this.emit('loaded-clusters', this.clusterList);
  }

  /**
   * Sets an error condition. Will notify listeners by emitting an 'error' event.
   * @param err The error.
   */
  set error(err: Error | undefined) {
    this.lastError = err;
    if (err) {
      this.emit('error', this.lastError);
    }
  }

  /**
   * Fetches the list of environments.
   * @returns Returns the list of discovered environments.
   */
  get environments(): string[] {
    return this.environmentList;
  }

  /**
   * Sets the list of environments. Notifies listeners by emitting a 'loaded-environments' event.
   * @param environments The array of discovered environments.
   */
  set environments(environments: string[]) {
    this.environmentList = environments;
    this.emit('loaded-environments', this.environmentList);
  }

  /**
   * Fetches the list of discovered regions.
   */
  get regions(): string[] {
    return this.regionList;
  }

  /**
   * Sets the list of discovered regions. Notifies listeners by emitting a 'loaded-regions' event.
   * @param regions The array of discovered regions.
   */
  set regions(regions: string[]) {
    this.regionList = regions;
    this.emit('loaded-regions', this.regionList);
  }
}
