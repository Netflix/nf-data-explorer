import { IRecentQuery } from '@/utils/recent-queries-utils';
import {
  ICassandraFeatureMap,
  IClusterSchemaColumn,
  IDatacenter,
  IKeyspace,
  ITableSchema,
  IUserDefinedType,
  IClusterInfo,
} from '@cassandratypes/cassandra';
import { IClusterRegionSummary } from '@sharedtypes/typings';
import HttpStatusError from '@/models/errors/HttpStatusError';

/**
 * ****************
 * App State (Vuex)
 * ****************
 */
export interface IAppState {
  config: IConfigModuleState;
  cassandra: ICassModuleState;
  route: IRouteModuleState; // provide by vuex plugin
  user: IUserModuleState;
}

/**
 * ******************
 * Vuex Module States
 * ******************
 */
export interface IUserModuleState {
  email: string | undefined;
  username: string | undefined;
  isAdmin: boolean;
  token: string | undefined;
  isSessionInvalidated: boolean;
}

interface IRegionInfo {
  env: string;
  region: string;
}

export interface IAppEnvironments {
  available: IRegionInfo[];
  current: IRegionInfo;
}

export interface IConfigModuleState {
  clusters: IClusterRegionSummary[];
  currentCluster: string | undefined;
  environments: IAppEnvironments | undefined;
  currentDatastoreScope: 'cassandra' | 'dynomite' | undefined;
}

export interface ICassModuleState {
  cluster: ICassClusterModuleState;
  explore: ICassExploreModuleState;
  features: ICassandraFeatureMap;
  query: ICassQueryModuleState;
}

interface IColumn {
  name: string;
  type: 'partition' | 'clustering';
  dataType: string;
}

interface ITable {
  name: string;
  columns: IColumn[];
}

export interface ICassClusterModuleState {
  datacenters: IDatacenter[];
  datacentersLoading: boolean;
  info: IClusterInfo | undefined;
  keyspaces: IKeyspace[];
  keyspacesLoading: boolean;
  schema: IClusterSchemaColumn[];
  schemaLoading: boolean;
  dataTypesLoading: boolean;
  dataTypes: {
    standard: string[];
    user: IUserDefinedType[];
  };
}

export interface ICassExploreModuleState {
  keyspace: IKeyspace | undefined;
  keyspaceError: HttpStatusError | undefined;
  keyspaceLoading: boolean;
  keyspaceTables: ITable[];
  keyspaceUDTs: IUserDefinedType[];
  keyspaceTablesLoading: boolean;
  tableSchema: ITableSchema | undefined;
  tableSchemaLoading: boolean;
}

export interface ICassQueryModuleState {
  queryHistory: IRecentQuery[];
}

export interface IRouteModuleState {
  fullPath: string;
  params: {
    [key: string]: string;
  };
}
