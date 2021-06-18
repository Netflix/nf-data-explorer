import Redis from 'ioredis';
import { MAX_KEY_STRING_SIZE_CHARS } from '../lib/dynomite-constants';
import DynomiteCluster from '../lib/DynomiteCluster';
import DynomiteExplorer from '../lib/DynomiteExplorer';
import { KeyNotFoundError, KeyTooLargeError } from '../lib/errors';
import { IKeyValue } from '../typings/dynomite';

jest.mock('../lib/DynomiteCluster');
jest.mock('ioredis');

const azCount = 3;

export const mockRedisConnection = new Redis();
jest.mock('../lib/DynomiteCluster', () => {
  return jest.fn().mockImplementation(() => ({
    getConnection: async () => mockRedisConnection,
    executeCommandInSingleZone: async (
      cb: (callback: Redis.Redis) => Promise<any>,
    ) => {
      return Promise.all(
        Array.from(new Array(azCount)).map((_) => cb(mockRedisConnection)),
      );
    },
  }));
});

describe('DynomiteExplorer suite', () => {
  let explorer: DynomiteExplorer;

  beforeEach(() => {
    (DynomiteCluster as any).mockClear();
    explorer = new DynomiteExplorer({
      env: 'test',
      instances: [],
      name: 'test_cluster',
      region: 'us-east-1',
      datastoreType: 'dynomite',
    });
  });

  describe('getValue() tests', () => {
    describe('string type tests', () => {
      const defaultType = 'string';
      const defaultTtl = 10000;

      beforeEach(() => {
        mockRedisConnection.type = jest.fn().mockResolvedValue(defaultType);
        mockRedisConnection.ttl = jest.fn().mockResolvedValue(defaultTtl);
      });

      it('should get a string value', async () => {
        const value: IKeyValue = {
          name: 'string-key',
          ttl: defaultTtl,
          type: defaultType,
          value: 'cat',
        };
        (mockRedisConnection.get as any).mockResolvedValue(value.value);
        const result = await explorer.getValue(value.name);
        expect(result).toEqual(value);
        expect(mockRedisConnection.get).toBeCalledTimes(1);
      });

      it('should throw if key value is too long', () => {
        mockRedisConnection.strlen = jest
          .fn()
          .mockResolvedValue(MAX_KEY_STRING_SIZE_CHARS + 1);
        return expect(explorer.getValue('long-key')).rejects.toThrowError(
          KeyTooLargeError,
        );
      });
    });

    describe('list type tests', () => {
      const defaultType = 'list';
      const defaultTtl = 10000;

      beforeEach(() => {
        mockRedisConnection.type = jest.fn().mockResolvedValue(defaultType);
        mockRedisConnection.ttl = jest.fn().mockResolvedValue(defaultTtl);
      });

      it('should get a list value', async () => {
        const value: IKeyValue = {
          name: 'list-key',
          ttl: defaultTtl,
          type: defaultType,
          value: '[a, b, c]',
        };
        (mockRedisConnection.lrange as any).mockResolvedValue(value.value);
        const result = await explorer.getValue(value.name);
        expect(result).toEqual(value);
        expect(mockRedisConnection.lrange).toBeCalledTimes(1);
      });
    });

    describe('set type tests', () => {
      beforeEach(() => {
        mockRedisConnection.type = jest.fn().mockResolvedValue('set');
      });

      it('should get a list value', async () => {
        const value: IKeyValue = {
          name: 'set-key',
          ttl: 10000,
          type: 'set',
          value: '[a, b, c]',
        };
        (mockRedisConnection.smembers as any).mockResolvedValue(value.value);
        const result = await explorer.getValue(value.name);
        expect(result).toEqual(value);
        expect(mockRedisConnection.smembers).toBeCalledTimes(1);
      });
    });

    describe('zset type tests', () => {
      beforeEach(() => {
        mockRedisConnection.type = jest.fn().mockResolvedValue('zset');
      });

      it('should get a list value', async () => {
        const value: IKeyValue = {
          name: 'zset-key',
          ttl: 10000,
          type: 'zset',
          value: '[a, 1, b, 2, c, 3]',
        };
        (mockRedisConnection.zrange as any).mockResolvedValue(value.value);
        const result = await explorer.getValue(value.name);
        expect(result).toEqual(value);
        expect(mockRedisConnection.zrange).toBeCalledTimes(1);
      });
    });

    describe('hash type tests', () => {
      beforeEach(() => {
        mockRedisConnection.type = jest.fn().mockResolvedValue('hash');
      });

      it('should get a list value', async () => {
        const value: IKeyValue = {
          name: 'zset-key',
          ttl: 10000,
          type: 'hash',
          value: '[a, 1, b, 2, c, 3]',
        };
        (mockRedisConnection.hgetall as any).mockResolvedValue(value.value);
        const result = await explorer.getValue(value.name);
        expect(result).toEqual(value);
        expect(mockRedisConnection.hgetall).toBeCalledTimes(1);
      });
    });

    it('should throw if key not found', () => {
      mockRedisConnection.type = jest.fn().mockResolvedValue('none');
      return expect(explorer.getValue('missing-key')).rejects.toThrowError(
        KeyNotFoundError,
      );
    });

    it('should throw on unsupported key type', () => {
      mockRedisConnection.type = jest.fn().mockResolvedValue('new-key-type');
      return expect(explorer.getValue('missing-key')).rejects.toThrow();
    });
  });

  describe('setValue() tests', () => {
    it('should call set value', () => {
      mockRedisConnection.set = jest.fn().mockResolvedValue('OK');
      return expect(
        explorer.setValue('test-key', 'test-value'),
      ).resolves.toEqual('OK');
    });
  });

  describe('deleteKey() tests', () => {
    beforeEach(() => {
      (mockRedisConnection.del as any).mockReset();
    });

    it('should throw KeyNotFoundError', () => {
      (mockRedisConnection.del as any).mockResolvedValue(0);
      return expect(explorer.deleteKey('missing-key')).rejects.toThrow(
        KeyNotFoundError,
      );
    });

    it('should return the deleted key count', () => {
      const deletedCount = 1;
      (mockRedisConnection.del as any).mockResolvedValue(deletedCount);
      return expect(explorer.deleteKey('missing-key')).resolves.toEqual({
        count: deletedCount,
      });
    });
  });

  describe('getInfo and getKeyCount()', () => {
    const keyCount = 12345;
    const keyString = `keys=${keyCount},expires=1400,avg_ttl=123`;
    const infoResponse = `# Server\r
key1:value1\r
key2:value2\r
# Clients\r
key3:value3\r
# Keyspace\r
db0:keys=${keyCount},expires=1400,avg_ttl=123\r
`;

    beforeEach(() => {
      (mockRedisConnection.info as any).mockResolvedValue(infoResponse);
    });

    it('should return info', () => {
      return expect(explorer.getInfo()).resolves.toEqual(
        Array.from(new Array(azCount)).map((_) => ({
          Clients: {
            key3: 'value3',
          },
          Keyspace: {
            db0: keyString,
          },
          Server: {
            key1: 'value1',
            key2: 'value2',
          },
        })),
      );
    });

    it('should return keyCount', () => {
      return expect(explorer.getKeyCount()).resolves.toEqual(
        keyCount * azCount,
      );
    });
  });
});
