import { IClusterDefinition } from '../../../typings/typings';

// tslint:disable-next-line
export interface IDatastoreConnectParams {}

export interface IExplorer {
  shutdown(): Promise<void>;
}

export interface IBaseDatastoreService {
  /**
   * Some clusters may be deployed using multiple stacks. This optional callback
   * can be used to create cluster definitions for each stack (effectivey ungrouping them).
   * If you don't need to ungroup a cluster, simply return `[singleCluster]`.
   * @param cluster
   */
  ungroupClustersCallback(cluster: IClusterDefinition): IClusterDefinition[];
}

export interface IDatastoreService<IExplorer> extends IBaseDatastoreService {
  /**
   * Connects to the configured datastore.
   * @param params
   */
  connect(params: IDatastoreConnectParams): Promise<IExplorer>;

  getDatastoreType(): string;

  /**
   * Callback to check if a given application name is a match for this datastore type.
   * @param appName
   */
  discoveryCallback(appName: string): boolean;
}
