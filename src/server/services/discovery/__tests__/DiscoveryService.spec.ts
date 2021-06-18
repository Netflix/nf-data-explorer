import { IClusterDefinition } from '@/typings/typings';
import { DiscoveryService } from '..';
import BaseDiscoveryProvider from '../providers/BaseDiscoveryProvider';

describe('DiscoveryService Suite', () => {
  it('test without provider', () => {
    expect(() => new DiscoveryService(undefined as any)).toThrow();
  });

  describe('test emitted events', () => {
    const discoveredClusters = [
      {
        env: 'test',
        instances: [],
        name: 'cluster_a',
        region: 'us-east-1',
        datastoreType: 'cassandra',
      },
    ] as IClusterDefinition[];
    const environments = ['test', 'prod'];
    const regions = ['us-east-1', 'eu-west-1', 'us-west-2'];

    it('should emit correct events', (done) => {
      const assertions = 3;
      expect.assertions(assertions);

      class MockDiscoveryProvider extends BaseDiscoveryProvider {
        public start() {
          this.clusters = discoveredClusters;
          this.environments = environments;
          this.regions = regions;
        }
      }

      let callbackCount = 0;
      const checkDone = () => {
        callbackCount++;
        if (callbackCount === assertions) {
          done();
        }
      };

      const discoveryService = new DiscoveryService(
        new MockDiscoveryProvider(),
      );
      discoveryService.on('loaded-clusters', (clusters) => {
        expect(clusters).toEqual(discoveredClusters);
        checkDone();
      });
      discoveryService.on('loaded-environments', (loadedEnvs) => {
        expect(loadedEnvs).toEqual(environments);
        checkDone();
      });
      discoveryService.on('loaded-regions', (loadedRegions) => {
        expect(loadedRegions).toEqual(regions);
        checkDone();
      });
      discoveryService.start();
    });
  });
});
