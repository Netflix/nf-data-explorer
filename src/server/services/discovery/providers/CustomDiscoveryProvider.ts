import BaseDiscoveryProvider from './BaseDiscoveryProvider';

export default class CustomDiscoveryProvider extends BaseDiscoveryProvider {
  public start(): void {
    // e.g. make a REST call to another service then call
    //
    // ```
    // try {
    //   this.clusters = [/* my clusters */];
    //   this.environments = [/* my environments */];
    //   this.regions = [/* my regions */];
    // } catch (err) {
    //   this.error = err;
    // }
    // ```
    throw new Error('CustomDiscoveryProvider must implement start()');
  }
}
