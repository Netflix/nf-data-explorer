// allows us to import json files
declare module '*.json' {
  const value: any;
  export default value;
}

export interface IInstanceDefinition {
  az: string;
  hostname: string;
  ip: string;
  stack: string;
  status: 'UP' | 'DOWN';
}

export interface IClusterSummaryMap {
  [datastoreType: string]: {
    [clusterName: string]: {
      [account: string]: {
        [region: string]: IClusterRegionSummary[];
      };
    };
  };
}

export interface IClusterSummary {
  name: string;
  isShared: boolean;
}

export type DatastoreType = 'cassandra' | 'dynomite';

export interface IClusterRegionSummary {
  name: string;
  isShared: boolean;
  env: string;
  region: string;
  type: DatastoreType;
}

export interface IClusterDefinition {
  /** The name of the datastore (e.g. `CASS_CLUSTER`) */
  name: string;
  /** The environment this cluster belongs to (e.g. `TEST` or `PROD`) */
  env: string;
  /** The cloud provider region the cluster is deployed in (e.g. `us-east-1`) */
  region: string;
  /** The type of datastore (e.g. `cassandra`) */
  datastoreType: DatastoreType;
  /** The list of individual instances/nodes */
  instances: IInstanceDefinition[];
}

export interface IRegionInfo {
  env: string;
  region: string;
}

export interface IClusterOwnership {
  name: string;
  isShared: boolean;
  owners: string[];
}

export interface IEntityOwnership {
  clusterName: string;
  env: string;
  name: string;
  owners: string[];
  type: 'KEYSPACE' | 'TABLE';
}

export interface IClusterAClMap {
  [datastoreName: string]: IClusterOwnership;
}

export interface IUser {
  email: string;
  familyName: string;
  fullName: string;
  givenName: string;
  googleGroups: string[];
  picture: string;
  thumbnailPhotoUrl: string;
}

export interface IClusterDefinitionWithConnectionInfoMap {
  [key: string]: IClusterDefinitionWithConnectionInfo[];
}

export interface IClusterDefinitionWithConnectionInfo
  extends IClusterDefinition {
  hasConnection: boolean;
}

export interface IAdminStatus {
  currentRegion: string;
  currentEnv: string;
  state: {
    acl: 'success' | 'failure';
    discovery: 'success' | 'failure';
  };
  acl: {
    [clusterName: string]: {
      isShared: boolean;
      name: string;
      owners: string[];
    };
  };
  available: {
    clusters: IClusterDefinitionWithConnectionInfoMap;
  };
  cache: IEntityOwnership[];
  userCache: Array<{
    email: string;
    groups: string[];
  }>;
}

export interface IDiscoveryMap {
  [datastoreType: string]: {
    /**
     * Callback used to check the naming convention of the application name to
     * see if it can be identified as one of the supported datastores.
     */
    matcher: (appName: string) => boolean;

    /**
     * Some clusters may be deployed using multiple stacks. This optional callback
     * can be used to create cluster definitions for each stack (effectivey ungrouping them).
     */
    ungroupClusters: (cluster: IClusterDefinition) => IClusterDefinition[];
  };
}
