import {
  Alias,
  Select,
} from '@/services/datastores/cassandra/lib/modules/query-builder';

const keyspace = 'keyspaceA';
const table = 'tableB';

describe('query builder suite', () => {
  const LIMIT = 100;

  it('should build a basic select all statement', () => {
    const selectTest = new Select.Builder()
      .all()
      .from(keyspace, table)
      .limit(LIMIT)
      .build();
    expect(selectTest).toEqual(
      `SELECT * FROM "keyspaceA"."tableB" LIMIT ${LIMIT}`,
    );
  });

  it('should build a basic select statement', () => {
    const selectTest = new Select.Builder()
      .columns(['columnA', 'columnB'])
      .from(keyspace, table)
      .limit(LIMIT)
      .build();
    expect(selectTest).toEqual(
      `SELECT "columnA", "columnB" FROM "keyspaceA"."tableB" LIMIT ${LIMIT}`,
    );
  });

  it('should build a select statement with single where clause', () => {
    const selectTest = new Select.Builder()
      .columns(['columnA', 'columnB'])
      .from(keyspace, table)
      .where(['columnA'])
      .limit(LIMIT)
      .build();
    expect(selectTest).toEqual(
      `SELECT "columnA", "columnB" FROM "keyspaceA"."tableB" WHERE "columnA"=? LIMIT ${LIMIT}`,
    );
  });

  it('should build a select statement with multiple where clause', () => {
    const selectTest = new Select.Builder()
      .columns(['columnA', 'columnB'])
      .from(keyspace, table)
      .where(['columnA', 'columnB', 'columnC'])
      .limit(LIMIT)
      .build();
    expect(selectTest).toEqual(
      `SELECT "columnA", "columnB" FROM "keyspaceA"."tableB" WHERE "columnA"=? AND "columnB"=? AND "columnC"=? LIMIT ${LIMIT}`,
    );
  });

  it('should build a select statement with an empty where clause', () => {
    const selectTest = new Select.Builder()
      .columns(['columnA', 'columnB'])
      .from(keyspace, table)
      .where([])
      .limit(LIMIT)
      .build();
    expect(selectTest).toEqual(
      `SELECT "columnA", "columnB" FROM "keyspaceA"."tableB" LIMIT ${LIMIT}`,
    );
  });

  it('should include TTL and writetime', () => {
    const selectTest = new Select.Builder()
      .columns(['columnA', 'columnB'])
      .columnsTtl(['columnA'])
      .columnsWriteTime(['columnA', 'columnB'])
      .from(keyspace, table)
      .where([])
      .limit(LIMIT)
      .build();
    expect(selectTest).toEqual(
      `SELECT "columnA", "columnB", TTL("columnA"), writetime("columnA"), writetime("columnB") FROM "keyspaceA"."tableB" LIMIT ${LIMIT}`,
    );
  });

  it('should should empty TTL and writetime', () => {
    const selectTest = new Select.Builder()
      .columns(['columnA', 'columnB'])
      .columnsTtl([])
      .columnsWriteTime([])
      .from(keyspace, table)
      .where([])
      .limit(LIMIT)
      .build();
    expect(selectTest).toEqual(
      `SELECT "columnA", "columnB" FROM "keyspaceA"."tableB" LIMIT ${LIMIT}`,
    );
  });

  it('should support column aliases', () => {
    const selectTest = new Select.Builder()
      .columns(['columnA', new Alias('columnB', 'other_column')])
      .from(keyspace, table)
      .build();
    expect(selectTest).toEqual(
      'SELECT "columnA", "columnB" as "other_column" FROM "keyspaceA"."tableB"',
    );
  });

  it('every where clause should be valid', () =>
    expect(() =>
      new Select.Builder()
        .columns(['columnA'])
        .from(keyspace, table)
        .where([''])
        .build(),
    ).toThrow());
});
