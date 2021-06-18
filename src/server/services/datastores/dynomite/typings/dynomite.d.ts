import { IDatastoreConnectParams } from '../../base/datastore'; // relative path needed for client to build

export interface IClientCursor {
  complete: boolean;
  cursors?: {
    [hostname: string]: number;
  };
}

export interface IScanResult {
  cursor: IClientCursor;
  keys: any[];
  count: number;
}

export interface IDynomiteInfo {
  Keyspace?: {
    [key: string]: string;
  };
}

export interface IKeyValue {
  name: string;
  type: any;
  value: any;
  ttl: number;
}

export interface IDynomiteConnectParams extends IDatastoreConnectParams {
  instance: any;
}

// Collection types

interface IDynoHash {
  ttl: number;
  type: 'hash';
  value: {
    [key: string]: string;
  };
}

interface IDynoList {
  ttl: number;
  type: 'list';
  value: string[];
}

interface IDynoSet {
  ttl: number;
  type: 'set';
  value: string[];
}

interface IDynoZset {
  ttl: number;
  type: 'zset';
  value: string[];
}

type IDynoCollectionKey = IDynoList | IDynoHash | IDynoSet | IDynoZset;

interface IDynoHashEntry {
  type: 'hash';
  key: string;
  value: string;
}

interface IDynoListItem {
  type: 'list';
  index: number;
  value: string;
}

interface IDynoSetItem {
  type: 'set';
  value: string;
}

interface IDynoZsetItem {
  type: 'zset';
  score: string;
  value: string;
}

type IDynoCollectionKeyValue =
  | IDynoHashEntry
  | IDynoListItem
  | IDynoSetItem
  | IDynoZsetItem;
