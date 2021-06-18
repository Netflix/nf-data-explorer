import { IClusterAClMap } from '@/typings/typings';
import ClusterAccessControlProvider from './ClusterAccessControlProvider';

export default class DefaultClusterAccessControlProvider extends ClusterAccessControlProvider {
  public async getClusterAccessControl(_options: any): Promise<IClusterAClMap> {
    return {};
  }
}
