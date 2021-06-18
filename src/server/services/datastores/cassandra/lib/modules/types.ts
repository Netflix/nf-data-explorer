import { Client, types } from 'cassandra-driver';
import { IUserDefinedType } from '../../typings/cassandra';
import * as config from '../cassandra-config';
import { isVersion3 } from '../utils/cluster-utils';
import { Select } from './query-builder';

/**
 * For v2 variants, the column types are returned as Java class names, so we need to do some
 * reverse mapping of the exposed built-in types to build a map of `className` -> `builtInType`.
 */
const { dataTypes } = types;
const singleTypeNames = {
  'org.apache.cassandra.db.marshal.UTF8Type': dataTypes.varchar,
  'org.apache.cassandra.db.marshal.AsciiType': dataTypes.ascii,
  'org.apache.cassandra.db.marshal.UUIDType': dataTypes.uuid,
  'org.apache.cassandra.db.marshal.TimeUUIDType': dataTypes.timeuuid,
  'org.apache.cassandra.db.marshal.Int32Type': dataTypes.int,
  'org.apache.cassandra.db.marshal.BytesType': dataTypes.blob,
  'org.apache.cassandra.db.marshal.FloatType': dataTypes.float,
  'org.apache.cassandra.db.marshal.DoubleType': dataTypes.double,
  'org.apache.cassandra.db.marshal.BooleanType': dataTypes.boolean,
  'org.apache.cassandra.db.marshal.InetAddressType': dataTypes.inet,
  'org.apache.cassandra.db.marshal.SimpleDateType': dataTypes.date,
  'org.apache.cassandra.db.marshal.TimeType': dataTypes.time,
  'org.apache.cassandra.db.marshal.ShortType': dataTypes.smallint,
  'org.apache.cassandra.db.marshal.ByteType': dataTypes.tinyint,
  'org.apache.cassandra.db.marshal.DateType': dataTypes.timestamp,
  'org.apache.cassandra.db.marshal.TimestampType': dataTypes.timestamp,
  'org.apache.cassandra.db.marshal.LongType': dataTypes.bigint,
  'org.apache.cassandra.db.marshal.DecimalType': dataTypes.decimal,
  'org.apache.cassandra.db.marshal.IntegerType': dataTypes.varint,
  'org.apache.cassandra.db.marshal.CounterColumnType': dataTypes.counter,
};

const dataTypeInverseMap = Object.entries(dataTypes).reduce(
  (prev, [name, index]) => prev.set(index as number, name),
  new Map<number, string>(),
);

const v2TypeMap = Object.entries(singleTypeNames).reduce(
  (prev, [className, dataTypeIndex]) =>
    prev.set(className, dataTypeInverseMap.get(dataTypeIndex) as string),
  new Map<string, string>(),
);

export async function getTypes(
  client: Client,
  keyspaceName: string,
): Promise<{ standard: string[]; user: IUserDefinedType[] }> {
  const unsupportedTypes = new Set(config.unsupportedTypes);
  const v3Types = new Set(config.version3Types);

  await client.connect();

  const isV3 = isVersion3(client);

  // filter for included standard types
  const keyspaceTypes = Object.keys(types.dataTypes).filter((key) => {
    const value = types.dataTypes[key];
    if (
      value instanceof Function ||
      (v3Types.has(key) && !isV3) ||
      unsupportedTypes.has(key)
    ) {
      return false;
    }
    return true;
  });

  // fetch UDTs
  const keyspace = isV3 ? 'system_schema' : 'system';
  const table = isV3 ? 'types' : 'schema_usertypes';
  const query = new Select.Builder()
    .all()
    .from(keyspace, table)
    .where(['keyspace_name'])
    .build();
  const results = await client.execute(query, [keyspaceName], {
    prepare: true,
  });

  return {
    standard: keyspaceTypes.sort(),
    user: results.rows.map((udt) => ({
      name: udt.type_name,
      fields: (udt.field_names as any[])
        .map((name, index) => {
          let type = udt.field_types[index];
          if (!isV3) {
            type = v2TypeMap.get(type) || type; // if we don't have a mapped type return the class name
          }
          return { name, type };
        })
        .sort((field) => field.name),
    })),
  };
}
