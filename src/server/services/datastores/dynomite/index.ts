import { getConfig } from '@/config/configuration';
import setupLogger from '@/config/logger';
import { IDatastoreService } from '@/services/datastores/base/datastore';
import DynomiteExplorer from '@/services/datastores/dynomite/lib/DynomiteExplorer';
import { IClusterDefinition } from '@/typings/typings';
import BaseDatastoreService from '../base/BaseDatastoreService';

const { CLUSTER_NAME_PATTERN_DYNOMITE } = getConfig();

const logger = setupLogger(module);

export default class DynomiteDatastoreService extends BaseDatastoreService
  implements IDatastoreService<DynomiteExplorer> {
  public getDatastoreType(): string {
    return 'dynomite';
  }

  public connect(cluster: IClusterDefinition): Promise<DynomiteExplorer> {
    logger.info(`creating new DynomiteExplorer for cluster: ${cluster.name}`);
    return Promise.resolve(new DynomiteExplorer(cluster));
  }

  public discoveryCallback(appName: string): boolean {
    return new RegExp(CLUSTER_NAME_PATTERN_DYNOMITE, 'i').test(appName);
  }
}
