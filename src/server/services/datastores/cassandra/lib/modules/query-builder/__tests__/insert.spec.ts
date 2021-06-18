import {
  ITableColumn,
  ITableSchema,
} from '@/services/datastores/cassandra/typings/cassandra';
import { getJsType } from '../../../utils/type-utils';
import { Insert } from '../insert';

interface IColumnType {
  name: string;
  type: string;
}

function buildSchema(
  keyspace: string,
  table: string,
  partitionKeys: IColumnType[],
  clusteringKeys: IColumnType[],
  columns: IColumnType[],
): ITableSchema {
  const mapColumn = (col: IColumnType): ITableColumn => {
    const jsType = getJsType(col.type);
    return {
      dataType: jsType,
      name: col.name,
      needsQuotes: jsType === 'string',
      options: {},
      type: col.type,
    };
  };
  const partitionKeyColumns = partitionKeys.map(mapColumn);
  const clusteringKeyColumns = clusteringKeys.map(mapColumn);

  return {
    properties: { comment: '' },
    clusteringKeys: clusteringKeyColumns,
    clusteringOrder: [],
    columns: columns.map(mapColumn),
    indexes: {},
    isThrift: false,
    keyspace,
    name: table,
    partitionKeys: partitionKeyColumns,
    primaryKey: [...partitionKeyColumns, ...clusteringKeyColumns],
  };
}

describe('insert escaping test suite', () => {
  const keyspaceName = 'keyspaceA';
  const tableName = 'tableB';

  let schema: ITableSchema;
  beforeEach(() => {
    schema = buildSchema(
      keyspaceName,
      tableName,
      [{ name: 'id', type: 'bigint' }],
      [],
      [{ name: 'text', type: 'varchar' }],
    );
  });

  it('should escape single quoted strings', () => {
    const stmt = new Insert.Builder()
      .into(schema)
      .value('id', 1234)
      .value('text', "this is Sally's record")
      .build();

    expect(stmt).toEqual(
      `INSERT INTO ${keyspaceName}.${tableName} ("id", "text") VALUES (1234, 'this is Sally''s record')`,
    );
  });

  it('should not modify strings without quotes', () => {
    const id = 1234;
    const str = 'unmodified string';
    const stmt = new Insert.Builder()
      .into(schema)
      .value('id', id)
      .value('text', str)
      .build();

    expect(stmt).toEqual(
      `INSERT INTO ${keyspaceName}.${tableName} ("id", "text") VALUES (${id}, '${str}')`,
    );
  });
});

describe('insert test suite', () => {
  const keyspaceName = 'keyspaceA';
  const tableName = 'tableB';

  let schema: ITableSchema;
  beforeEach(() => {
    schema = buildSchema(
      keyspaceName,
      tableName,
      [
        { name: 'columnA', type: 'varchar' },
        { name: 'columnB', type: 'bigint' },
      ],
      [],
      [{ name: 'columnC', type: 'boolean' }],
    );
  });

  it('should create a basic insert statement without standard columns', () => {
    const stmt = new Insert.Builder()
      .into(schema)
      .value('columnA', 'b')
      .value('columnB', 33)
      .build();
    expect(stmt).toEqual(
      `INSERT INTO ${keyspaceName}.${tableName} ("columnA", "columnB") VALUES ('b', 33)`,
    );
  });

  it('should create a basic insert statement with standard columns', () => {
    const stmt = new Insert.Builder()
      .into(schema)
      .value('columnA', 'b')
      .value('columnB', 33)
      .value('columnC', true)
      .build();
    expect(stmt).toEqual(
      `INSERT INTO ${keyspaceName}.${tableName} ("columnA", "columnB", "columnC") VALUES ('b', 33, true)`,
    );
  });

  it('should fail if primary key is not complete', () => {
    expect(() => {
      new Insert.Builder().into(schema).value('columnA', 'b').build();
    }).toThrow();
  });
});

describe('collection insert tests', () => {
  const keyspaceName = 'keyspaceA';
  const tableName = 'tableB';
  const cityColumn = 'city';
  const tempsColumn = 'temps';
  const zipCodesColumn = 'zipCodes';
  const regionsColumn = 'regionPopulations';

  const city = 'San Jose';

  let schema: ITableSchema;
  beforeEach(() => {
    schema = buildSchema(
      keyspaceName,
      tableName,
      [{ name: cityColumn, type: 'varchar' }],
      [],
      [
        { name: tempsColumn, type: 'list<int>' },
        { name: zipCodesColumn, type: 'set<int>' },
        { name: regionsColumn, type: 'map<varchar, int>' },
      ],
    );
  });

  describe('list types', () => {
    it('should generate an insert statement using List', () => {
      const temps = [72, 75, 76, 80, 77, 74, 73];
      const stmt = new Insert.Builder()
        .into(schema)
        .value(cityColumn, city)
        .value(tempsColumn, temps)
        .build();
      expect(stmt).toEqual(
        `INSERT INTO ${keyspaceName}.${tableName} ("${cityColumn}", "${tempsColumn}") VALUES ('${city}', [ ${temps.join(
          ', ',
        )} ])`,
      );
    });
  });

  describe('set types', () => {
    it('should generate an insert statement using Set', () => {
      const zipCodes = [95111, 95112, 95113];
      const stmt = new Insert.Builder()
        .into(schema)
        .value(cityColumn, city)
        .value(zipCodesColumn, zipCodes)
        .build();
      expect(stmt).toEqual(
        `INSERT INTO ${keyspaceName}.${tableName} ("${cityColumn}", "${zipCodesColumn}") VALUES ('${city}', { ${zipCodes.join(
          ', ',
        )} })`,
      );
    });
  });

  describe('map types', () => {
    it('should generate an insert statement using Map', () => {
      const stmt = new Insert.Builder()
        .into(schema)
        .value(cityColumn, city)
        .value(regionsColumn, {
          almaden: '10000',
          evergreen: '50000',
        })
        .build();
      expect(stmt).toEqual(
        `INSERT INTO ${keyspaceName}.${tableName} ("${cityColumn}", "${regionsColumn}") VALUES ('${city}', { 'almaden': 10000, 'evergreen': 50000 })`,
      );
    });
  });
});

describe('blob insert tests', () => {
  const keyspaceName = 'keyspaceA';
  const tableName = 'blob_table';
  const idColumn = 'id';
  const blobColumn = 'binary_content';

  let schema: ITableSchema;
  beforeEach(() => {
    schema = buildSchema(
      keyspaceName,
      tableName,
      [{ name: idColumn, type: 'varchar' }],
      [],
      [{ name: blobColumn, type: 'blob' }],
    );
  });

  it('should use textAsBlob() for binary values', () => {
    const idValue = '1234';
    const blobValue = 'blob content';
    const stmt = new Insert.Builder()
      .into(schema)
      .value(idColumn, idValue)
      .value(blobColumn, blobValue)
      .encoding('utf-8')
      .build();
    expect(stmt).toEqual(
      `INSERT INTO ${keyspaceName}.${tableName} ("${idColumn}", "${blobColumn}") VALUES ('${idValue}', textAsBlob('${blobValue}'))`,
    );
  });
});
