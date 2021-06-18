// eslint-disable-next-line @typescript-eslint/no-unused-vars
import express from 'express';
import CassandraExplorer from '@/services/datastores/cassandra/lib/CassandraExplorer';
import DynomiteExplorer from '@/services/datastores/dynomite/lib/DynomiteExplorer';
import { DatastoreType } from '@/typings/enums';
import { IClusterDefinition } from '@/typings/typings';

declare interface IRequestUserInfo {
  email: string;
  isAdmin: boolean;
  application: string;
  googleGroups: string[];
}

declare global {
  namespace Express {
    export interface Request {
      dynomiteApi: DynomiteExplorer;
      cassandraApi: CassandraExplorer;
      cluster: IClusterDefinition;
      datastoreType: DatastoreType;
      keyspaceName: string;
      tableName: string;
      user: IRequestUserInfo;
    }
  }
}
