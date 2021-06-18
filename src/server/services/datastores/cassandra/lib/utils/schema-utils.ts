import { isVersion3 } from '@/services/datastores/cassandra/lib/utils/cluster-utils';
import {
  ICachingOptions,
  ICompressionOptions,
  ITableColumn,
  ITableSchema,
  IKeyQuery,
} from '@/services/datastores/cassandra/typings/cassandra';
import { Client } from 'cassandra-driver';
import _ from 'lodash';
import { escapeValueString } from './statement-utils';

/**
 * Helper method for extracting the class name from a fully qualified class name (including java package).
 * @param   fullyQualifiedClass  The fully qualified class name.
 * @returns Returns just the Class portion.
 */
export function getClassName(fullyQualifiedClass: string): string {
  const classNamePattern = new RegExp('.*\\.(.*)');
  const match = classNamePattern.exec(fullyQualifiedClass);
  return match && match.length === 2 ? match[1] : '';
}

export function getCachingDetails(caching: string): ICachingOptions {
  try {
    const result = JSON.parse(caching.replace(/'/g, '"')) as {
      keys: string;
      rows_per_partition: string;
    };
    return {
      keys: result.keys as 'ALL' | 'NONE',
      rows: result.rows_per_partition as 'ALL' | 'NONE',
    };
  } catch (err) {
    throw new Error(`Invalid caching string: "${caching}"`);
  }
}

export function getCompressionDetails(compressionInfo: {
  [key: string]: string;
}): ICompressionOptions {
  // note, this is our attempt at handling the different C* versions as well as different property
  // names based on the driver version
  const patternMap = {
    'class|sstable_compression': 'class',
    '^chunk_length_(in_)?kb$': 'chunk_length_kb',
  } as {
    [pattern: string]: string;
  };

  const compressionDetails = {} as {
    [key: string]: any;
    class: string;
  };
  Object.keys(compressionInfo).forEach((key) => {
    // test to see if we have aliased this property
    const patterns = Object.keys(patternMap);
    let alias: string | undefined = undefined;
    for (const pattern of patterns) {
      if (new RegExp(pattern).test(key)) {
        alias = patternMap[pattern];
        break;
      }
    }
    compressionDetails[alias || key] = compressionInfo[key];
  });

  // rewrite the the 'class' property to use the the Compressor class name
  compressionDetails.class = getClassName(compressionDetails.class);

  return compressionDetails;
}

/**
 * Helper method for extracting the compaction strategy details for a row from the system tables. Also handles the
 * version differences between 2.x and 3.x.
 * @param  row
 * @return {{strategy: String, options: Object}}
 */
export function extractCompaction(
  client: Client,
  row: any,
): {
  strategy: string | undefined;
  options: any;
} {
  let strategy;
  let options;
  if (isVersion3(client)) {
    strategy = row.compaction.class;
    options = _.omit(row.compaction, 'class');
  } else {
    strategy = row.compaction_strategy_class;
    options = row.compaction_strategy_options;
  }
  return { strategy: getClassName(strategy), options };
}

/**
 * Given a schema, this helper method will generate a list of additional column queries useful for
 * including additional row metadata (e.g. TTL information).
 * @param  schema      The table schema.
 * @return Returns an array of additional column queries.
 */
export function getAdditionalQueryColumns(schema: ITableSchema): string[] {
  const partitionKeyNameSet = new Set(
    schema.partitionKeys.map((col) => col.name),
  );
  const clusteringKeyNameSet = new Set(
    schema.clusteringKeys.map((col) => col.name),
  );

  const additionalColumns = schema.columns.filter((col) => {
    const isCollection = col.type.match(/.*<.*>/);
    return (
      !isCollection &&
      !partitionKeyNameSet.has(col.name) &&
      !clusteringKeyNameSet.has(col.name)
    );
  });

  const ttlColumns = additionalColumns.map((col) => `TTL("${col.name}")`);
  const writeTimeColumns = additionalColumns.map(
    (col) => `writetime("${col.name}")`,
  );
  return new Array<string>().concat(ttlColumns, writeTimeColumns);
}

/**
 * Given a schema, this helper method will generate a list of additional column queries useful for
 * including additional row metadata (e.g. TTL information).
 * @param  schema      The table schema.
 * @return Returns an array of additional column queries.
 */
export function getAdditionalQueryColumnNames(schema: ITableSchema): string[] {
  const { partitionKeys, clusteringKeys, columns } = schema;
  const partitionKeyNameSet = new Set(partitionKeys.map((col) => col.name));
  const clusteringKeyNameSet = new Set(clusteringKeys.map((col) => col.name));
  return columns
    .filter((col) => {
      const isCollection = col.type.match(/.*<.*>/);
      return (
        !isCollection &&
        !partitionKeyNameSet.has(col.name) &&
        !clusteringKeyNameSet.has(col.name)
      );
    })
    .map((column) => column.name);
}

/**
 * Returns an array of where clauses using the primary key components.
 * @param schema      The table schema.
 * @param primaryKey  A map of primary key pairs where the keys are the name of the primary key fields
 *                    and the values are the primary key values. This is used to locate the record to
 *                    delete.
 * @return Returns an array of where clauses.
 */
export function getWhereClause(
  schema: ITableSchema,
  query: IKeyQuery,
): string[] {
  const columnMap = {} as {
    [columnName: string]: ITableColumn;
  };
  schema.columns.forEach((colDef) => {
    columnMap[colDef.name] = colDef;
  });

  const whereClauses = new Array<string>();
  const { primaryKey, options } = query;
  Object.keys(primaryKey).forEach((keyName) => {
    const details = primaryKey[keyName];
    const { value } = details;

    const column = columnMap[keyName];
    const { needsQuotes, type } = column;

    let keyValue: any;
    if (type === 'blob' && options.encoding !== 'hex') {
      if (options.encoding === 'base64') {
        const utf8Data = Buffer.from(value, 'base64').toString('utf-8');
        const escapedValue = escapeValueString(utf8Data as string);
        keyValue = `textAsBlob('${escapedValue}')`;
      } else {
        const escapedValue = escapeValueString(value as string);
        keyValue = `textAsBlob('${escapedValue}')`;
      }
    } else if (needsQuotes) {
      keyValue = `'${value}'`;
    } else {
      keyValue = value;
    }

    whereClauses.push(`"${keyName}"=${keyValue}`);
  });
  return whereClauses;
}

/**
 * Checks the column flags for a v3 schema as stored in the "flags" column
 * of the "system_schema.tables" table.
 */
export function isThriftV3(columnFlags: string[]): boolean {
  const flags = new Set(columnFlags);
  return flags.has('super') || flags.has('dense') || !flags.has('compound');
}

export function isThriftV2(isDense: boolean, comparator: string): boolean {
  const isComposite =
    comparator.indexOf('org.apache.cassandra.db.marshal.CompositeType') !== -1;
  return isDense || !isComposite;
}

export function getBlobColumnNames(
  schema: ITableSchema,
  primaryKeyOnly: boolean,
): Set<string> {
  const { columns, primaryKey } = schema;
  const includeColumns = primaryKeyOnly ? primaryKey : columns;
  return includeColumns.reduce((set, curr) => {
    const { type, name } = curr;
    if (type.includes('blob')) {
      set.add(name);
    }
    return set;
  }, new Set<string>());
}
