import {
  LeveledCompactionStrategyOptions,
  SizeTieredCompactionStrategyOptions,
  TimeWindowCompactionStrategyOptions,
} from '@/services/datastores/cassandra/lib/modules/schema-builder/compaction';
import CompressionOptions from '@/services/datastores/cassandra/lib/modules/schema-builder/CompressionOptions';
import Create from '@/services/datastores/cassandra/lib/modules/schema-builder/Create';
import {
  Version,
  Versions,
} from '@/services/datastores/cassandra/lib/modules/schema-builder/Version';
import {
  ICreateTableOptions,
  ITableProperties,
} from '@/services/datastores/cassandra/typings/cassandra';
import { camelCase } from 'lodash';
import CompactionOptions from './compaction/CompactionOptions';

/**
 * Returns a SchemaBuilder class that is suitable for the given version.
 * @param   version         The C* version to target.
 * @return  Returns a bound SchemaBuilder for the target version.
 */
function getSchemaBuilderClass(version: Version) {
  return class SchemaBuilder {
    public static get KEY_CACHING_STRATEGY() {
      return {
        NONE: 'NONE',
        ALL: 'ALL',
      };
    }

    public static get ROW_CACHING_STRATEGY() {
      return {
        NONE: 'NONE',
        ALL: 'ALL',
      };
    }

    /**
     * Returns a new Create Table Statement. Callers can use the fluent interface, similar to the Java driver,
     * for setting all the available options.
     * @param keyspaceName
     * @param tableName
     */
    public static createTable(keyspaceName: string, tableName: string) {
      return new Create(keyspaceName, tableName, version);
    }

    /**
     * Returns a new Create Table Statement that has all the properties populated.
     * This is an alternative to the standard Fluent interface.
     * @param   createOptions   All create options.
     * @returns
     * @see {@link Version}
     */
    public static createTableWithOptions(createOptions: ICreateTableOptions) {
      const createOptionsClone = JSON.parse(
        JSON.stringify(createOptions),
      ) as ICreateTableOptions;
      const {
        keyspace,
        table,
        partitionColumns = [],
        clusteringColumns = [],
        staticColumns = [],
        options = {} as ITableProperties,
      } = createOptionsClone;

      const createTableStmt = SchemaBuilder.createTable(keyspace, table);

      // setup to add options
      const createWithOptions = createTableStmt.withOptions();

      partitionColumns.forEach((key) =>
        createTableStmt.addPartitionColumn(key.name, key.type),
      );
      clusteringColumns.forEach((col) => {
        createTableStmt.addClusteringColumn(col.name, col.type);
        if (col.sort) {
          createWithOptions.clusteringOrder(col.name, col.sort);
        }
      });
      staticColumns.forEach((col) =>
        createTableStmt.addStaticColumn(col.name, col.type),
      );

      // add remaining options
      Object.keys(options).forEach((optionName) => {
        const { class: className, options: strategyOptions } = options[
          optionName
        ];
        switch (optionName) {
          case 'compaction': {
            if (className) {
              const strategy = SchemaBuilder.compactionStrategyByName(
                className,
              );
              SchemaBuilder._setStrategyOptions(strategy, strategyOptions);
              createWithOptions.compactionOptions(strategy);
            }
            break;
          }
          case 'compression':
            const optionValue = options[optionName];
            if (optionValue) {
              const {
                class: strategyName,
                ...compressionOptions
              } = optionValue;
              createWithOptions.compression(
                SchemaBuilder.compressionStrategyByName(
                  strategyName,
                  compressionOptions,
                ),
              );
            }
            break;

          case 'order':
            if (options.order) {
              options.order.forEach((col) =>
                createWithOptions.clusteringOrder(col.name, col.direction),
              );
            }
            break;

          case 'caching': {
            if (options.caching) {
              const { keys, rows } = options.caching;
              if (!keys || !rows) {
                throw new Error(`Invalid caching value: "${options.caching}"`);
              }
              createWithOptions.caching(keys, rows);
            }
            break;
          }
          default:
            if (typeof createWithOptions[optionName] === 'function') {
              const optionValue = options[optionName];
              createWithOptions[optionName](optionValue);
            } else {
              // tslint:disable-next-line
              console.error(`unknown table option: ${optionName}`);
            }
        }
      });

      return createWithOptions;
    }

    public static _setStrategyOptions(
      strategy: CompactionOptions,
      options: Record<string, unknown>,
    ) {
      if (options) {
        Object.keys(options).forEach((strategyOption) => {
          const strategyOptionValue = options[strategyOption];
          strategy[strategyOption](strategyOptionValue);
        });
      }
    }

    public static leveledStrategy() {
      return new LeveledCompactionStrategyOptions();
    }

    public static sizeTieredStrategy() {
      return new SizeTieredCompactionStrategyOptions();
    }

    public static timeWindowStrategy() {
      return new TimeWindowCompactionStrategyOptions();
    }

    public static compactionStrategyByName(name: string) {
      switch (name) {
        case LeveledCompactionStrategyOptions.NAME:
          return SchemaBuilder.leveledStrategy();

        case SizeTieredCompactionStrategyOptions.NAME:
          return SchemaBuilder.sizeTieredStrategy();

        case TimeWindowCompactionStrategyOptions.NAME:
          return SchemaBuilder.timeWindowStrategy();

        default:
          throw new Error(`Unknown compaction strategy ${name}`);
      }
    }

    public static noCompression() {
      return new CompressionOptions(
        CompressionOptions.ALGORITHMS.NONE,
        version,
      );
    }

    public static lz4() {
      return new CompressionOptions(CompressionOptions.ALGORITHMS.LZ4, version);
    }

    public static snappy() {
      return new CompressionOptions(
        CompressionOptions.ALGORITHMS.SNAPPY,
        version,
      );
    }

    public static deflate() {
      return new CompressionOptions(
        CompressionOptions.ALGORITHMS.DEFLATE,
        version,
      );
    }

    public static compressionStrategyByName(name: string, options: any) {
      let compressionStrategy: CompressionOptions;
      switch (name) {
        case CompressionOptions.ALGORITHMS.NONE:
          compressionStrategy = SchemaBuilder.noCompression();
          break;

        case CompressionOptions.ALGORITHMS.LZ4:
          compressionStrategy = SchemaBuilder.lz4();
          break;

        case CompressionOptions.ALGORITHMS.SNAPPY:
          compressionStrategy = SchemaBuilder.snappy();
          break;

        case CompressionOptions.ALGORITHMS.DEFLATE:
          compressionStrategy = SchemaBuilder.deflate();
          break;

        default:
          throw new Error(`Unknown compression strategy ${name}`);
      }
      if (options) {
        // since properties are passed in using the table property format returned by the driver
        // (e.g. "chunk_length_kb", we try to call the "chunkLengthKb() method on the given
        // CompressionStrategy class).
        Object.keys(options).forEach((optionName) => {
          const methodName = camelCase(optionName);
          const optionValue = options[optionName];
          if (compressionStrategy[methodName]) {
            compressionStrategy[methodName](optionValue);
          } else {
            throw new Error(
              `"${optionName}" is not a valid option for compression strategy: "${name}"`,
            );
          }
        });
      }
      return compressionStrategy;
    }
  };
}

export const v2x = getSchemaBuilderClass(Versions.v2x);
export const v3x = getSchemaBuilderClass(Versions.v3x);
export const latest = v3x;
