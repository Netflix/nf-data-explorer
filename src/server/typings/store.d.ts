import { State } from '@/typings/enums';
import { IClusterAClMap, IClusterDefinition } from '@/typings/typings';

export interface IStore {
  accessControl: IAccessControlState;
  discovery: IDiscoveryState;
}

export interface IAccessControlState {
  clusterAclMap: IClusterAClMap | undefined;
  status: State | undefined;
}

export interface IDiscoveryState {
  clusters: {
    [datastoreType: string]: IClusterDefinition[];
  };
  environments: string[];
  regions: string[];
  status: State | undefined;
}
