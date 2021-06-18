import ClusterAccessControlService from '@/services/cluster-acls/ClusterAccessControlService';
import ClusterAccessControlProvider from '@/services/cluster-acls/providers/ClusterAccessControlProvider';

describe('ClusterAccessControlService', () => {
  describe('test without provider', () => {
    it('must have a provider set', () => {
      const clusterAclService = new ClusterAccessControlService();
      expect(() => clusterAclService.start()).toThrow();
    });
  });

  describe('test mock provider', () => {
    let clusterAclService: ClusterAccessControlService;
    let mockProvider: ClusterAccessControlProvider;

    beforeEach(() => {
      jest.useFakeTimers();

      const MockProvider = jest.fn<ClusterAccessControlProvider, any[]>(() => ({
        currentEnvironment: 'test',
        currentRegion: 'us-east-1',
        regions: ['us-east-1'],
        environments: ['test'],
        getClusterAccessControl: jest.fn(),
      }));
      mockProvider = new MockProvider();

      clusterAclService = new ClusterAccessControlService();
      clusterAclService.use(mockProvider);
    });

    test('should use given provider', async () => {
      await clusterAclService.refresh();
      expect(mockProvider.getClusterAccessControl).toBeCalled();
    });

    test('starting the service should setup a timer to poll', async () => {
      await clusterAclService.start();
      expect(mockProvider.getClusterAccessControl).toBeCalled();
      expect(setTimeout).toBeCalled();
    });
  });
});
