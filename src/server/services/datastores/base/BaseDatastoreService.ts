import { IClusterDefinition } from '@/typings/typings';
import { IBaseDatastoreService } from './datastore';

export default abstract class BaseDatastoreService
  implements IBaseDatastoreService {
  public ungroupClustersCallback(
    cluster: IClusterDefinition,
  ): IClusterDefinition[] {
    return [cluster];
  }
}
