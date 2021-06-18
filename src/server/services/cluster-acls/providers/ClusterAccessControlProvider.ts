import { IClusterAClMap } from '@/typings/typings';

export default abstract class ClusterAccessControlProvider {
  constructor(
    readonly environments: string[],
    readonly regions: string[],
    readonly currentEnvironment: string,
    readonly currentRegion: string,
  ) {}

  /**
   * Fetches access control information.
   *
   * Expected to return a Promise containing a map, where application name is the key,
   * and the value contains a list of groups/emails that are permitted access.
   *
   * @param  options Options object containing implementation specific properties.
   * @return Returns a map of cluster access control information.
   */
  public abstract getClusterAccessControl(
    options: any,
  ): Promise<IClusterAClMap>;
}
