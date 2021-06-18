import BaseDiscoveryProvider from '@/services/discovery/providers/BaseDiscoveryProvider';

/**
 * A localhost based DiscoveryService.
 *
 * This implementation provides a simple way to connect to datastores running locally.
 */
export default class LocalDiscoveryProvider extends BaseDiscoveryProvider {
  constructor(readonly port: number) {
    super();
  }

  /**
   * @inheritdoc
   */
  public start(): void {
    this.clusters = [
      {
        name: 'cassandra',
        env: 'local',
        region: 'local',
        datastoreType: 'cassandra',
        instances: [
          {
            az: 'local',
            hostname: 'cassandra',
            ip: '127.0.0.1',
            status: 'UP',
            stack: '',
          },
        ],
      },
      {
        name: 'dynomite',
        env: 'local',
        region: 'local',
        datastoreType: 'dynomite',
        instances: [
          {
            az: 'local',
            hostname: 'dynomite',
            ip: '127.0.0.1',
            status: 'UP',
            stack: '',
          },
        ],
      },
    ];
    this.environments = ['local'];
    this.regions = ['local'];
  }
}
