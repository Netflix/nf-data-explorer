import ClusterAccessControlProvider from './ClusterAccessControlProvider';
import { IClusterAClMap } from '@/typings/typings';

export default class CustomAccessControlProvider extends ClusterAccessControlProvider {
  public getClusterAccessControl(_options: any): Promise<IClusterAClMap> {
    throw new Error('Method not implemented.');
  }
}
