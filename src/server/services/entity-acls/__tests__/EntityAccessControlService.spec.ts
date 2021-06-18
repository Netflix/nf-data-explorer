import { EntityType } from '@/typings/enums';
import EntityAccessControlService from '../EntityAccessControlService';
import { IEntityAccessControlProvider } from '../providers/EntityAccessControlProvider';

describe('EntityAccessControlService', () => {
  let mockProvider: IEntityAccessControlProvider;
  let entityAclService: EntityAccessControlService;

  beforeEach(() => {
    const MockProvider = jest.fn<IEntityAccessControlProvider, any[]>(() => ({
      getEntityOwners: jest.fn(),
      setEntityOwners: jest.fn(),
    }));
    mockProvider = new MockProvider();

    entityAclService = new EntityAccessControlService(mockProvider);
  });

  test('get() should delegate to provider', async () => {
    await entityAclService.getEntityOwners(
      'cluster_a',
      'test',
      EntityType.KEYSPACE,
      'entity_a',
    );
    expect(mockProvider.getEntityOwners).toBeCalled();
  });

  test('set() should delegate to provider', async () => {
    await entityAclService.setEntityOwners(
      'cluster_a',
      'test',
      EntityType.KEYSPACE,
      'entity_a',
      ['owner_a', 'owner_b'],
    );
    expect(mockProvider.setEntityOwners).toBeCalled();
  });
});
