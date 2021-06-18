import { getConfig } from '@/config/configuration';
import setupLogger from '@/config/logger';
import FeatureDisabledError from '@/model/errors/FeatureDisabledError';
import OperationNotSupportedInEnvError from '@/model/errors/OperationNotSupportedInEnvError';
import { CassandraTableCreationError } from '@/services/datastores/cassandra/lib/errors/CassandraTableCreationError';
import { IClusterDefinition } from '@/typings/typings';
import { getCassandraAccess } from '@/utils/cde-utils';
import { sendFile } from '@/utils/response-utils';
import { Request, Router } from 'express';
import { fromBuffer } from 'file-type';
import { isText } from 'istextorbinary';
import keys from './keys';

const logger = setupLogger(module);

const {
  CASSANDRA_ALLOW_DROP_TABLE,
  CASSANDRA_ALLOW_TRUNCATE_TABLE,
  CASSANDRA_ENVIRONMENTS_ALLOWING_DESTRUCTIVE_OPERATIONS,
} = getConfig();

const router = Router();

/**
 * Fetches the list of tables for the given keyspace.
 */
router.get('/', async (req: Request, res, next) => {
  logger.info(`fetching all tables in keyspace: ${req.keyspaceName}`, req);
  try {
    const tables = await req.cassandraApi.getTables(req.keyspaceName);
    res.json(tables);
  } catch (err) {
    next(err);
  }
});

/**
 * Creates a new table.
 *
 * If a `preview` query param is provided, then the statement will be generated, but will not be executed.
 */
router.post('/', async (req: Request, res, next) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.query, 'preview')) {
      // preview only mode
      logger.debug(
        `previewing table schema: ${req.keyspaceName}.${req.body.table}`,
        req,
      );
      const statement = await req.cassandraApi.generateCreateStatement(
        req.body,
      );
      res.json({ statement });
    } else {
      // non-preview
      const keyspaces = await req.cassandraApi.getKeyspaces();
      const clusterAccess = await getCassandraAccess(
        req.user,
        req.cluster,
        keyspaces,
      );

      const createStatement = req.body.createStatement as string;
      if (createStatement) {
        // ensure we have a create statement
        if (!createStatement.trim().toLowerCase().startsWith('create table')) {
          throw new CassandraTableCreationError(
            req.keyspaceName,
            req.body.table,
            'Invalid create table statement.',
          );
        }

        // free-form create statement has been provided
        const table = await req.cassandraApi.createTableAdvanced(
          req.keyspaceName,
          req.body.table,
          createStatement,
          clusterAccess,
        );
        res.json(table);
      } else {
        // the typed create table options payload
        logger.info(
          `creating new table schema: ${req.keyspaceName}.${req.body.table}`,
          req,
        );
        const table = await req.cassandraApi.createTable(
          req.body,
          clusterAccess,
        );
        res.json(table);
      }
    }
  } catch (err) {
    next(err);
  }
});

/**
 * Simple middleware that attaches the `tableName` to the request for easy retrieval.
 */
router.param('table', (req: Request, res, next, tableName) => {
  req.tableName = tableName;
  next();
});

/**
 * Fetches the schema definition for a given table.
 */
router.get('/:table', async (req: Request, res, next) => {
  const { keyspaceName, tableName } = req;
  logger.info(`fetching table schema: ${keyspaceName}.${tableName}`, req);
  try {
    const table = await req.cassandraApi.getTable(keyspaceName, tableName);
    res.json(table);
  } catch (err) {
    next(err);
  }
});

router.delete('/:table', async (req: Request, res, next) => {
  const { keyspaceName, tableName, cluster } = req;
  try {
    if (!CASSANDRA_ALLOW_DROP_TABLE) {
      logger.info('drop table feature is disabled', req);
      throw new FeatureDisabledError('CASSANDRA_ALLOW_DROP_TABLE');
    }

    validateSafeEnv(cluster, 'DROP');
    logger.info(`dropping table: ${keyspaceName}.${tableName}`, req);
    const result = await req.cassandraApi.dropTable(keyspaceName, tableName);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/:table/truncate', async (req: Request, res, next) => {
  const { keyspaceName, tableName, cluster } = req;
  try {
    if (!CASSANDRA_ALLOW_TRUNCATE_TABLE) {
      logger.info('truncate table feature is disabled', req);
      throw new FeatureDisabledError('CASSANDRA_ALLOW_TRUNCATE_TABLE');
    }

    validateSafeEnv(cluster, 'TRUNCATE');
    logger.info(`truncating table: ${keyspaceName}.${tableName}`, req);
    const result = await req.cassandraApi.truncateTable(
      keyspaceName,
      tableName,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

function validateSafeEnv(cluster: IClusterDefinition, operationName: string) {
  if (
    !CASSANDRA_ENVIRONMENTS_ALLOWING_DESTRUCTIVE_OPERATIONS.includes(
      cluster.env,
    )
  ) {
    throw new OperationNotSupportedInEnvError(operationName, cluster.env);
  }
}

/**
 * Generates a friendlier filename for a blob download.
 * @param cluster The cluster object.
 * @param keyspace The name of the keyspace
 * @param table The name of the table.
 * @param primaryKey An object consisting of the row's primary key
 * @param binaryColumnName The name of the blob column to fetch.
 */
function generateFilename(
  cluster: IClusterDefinition,
  keyspace: string,
  table: string,
  primaryKey: any,
  binaryColumnName: string,
): string {
  return [
    cluster.name.toUpperCase(),
    `${keyspace}.${table}`,
    Object.entries(primaryKey)
      .map(([key, value]) => `${key}.${value}`)
      .join('__'),
    binaryColumnName,
  ].join('____');
}

router.post('/:table/binary', async (req: Request, res, next) => {
  logger.info('retrieving binary column data', req);
  const { cluster, keyspaceName: keyspace, tableName: table } = req;

  try {
    const { primaryKey, columnName } = req.body;
    const { hex } = req.query;

    const data = await req.cassandraApi.getBinaryValue(
      keyspace,
      table,
      primaryKey,
      columnName,
    );

    if (data === null) {
      return res.status(204).send('Binary field is empty');
    }

    const filename = generateFilename(
      cluster,
      keyspace,
      table,
      primaryKey,
      columnName,
    );
    const useHex = hex && hex === 'true';
    if (useHex) {
      // if we can't detect the content type, we'll default to hex.
      logger.error(
        `Retrieving binary content as hex from "${keyspace}"."${table}"`,
        req,
      );
      const hexData = `0x${data.toString('hex')}`;
      return sendFile(
        res,
        'application/octet-stream',
        filename,
        hexData,
        Buffer.byteLength(hexData, 'utf8'),
      );
    }

    // attempt to detect the mime type so we can let the browser open the appropriate viewer
    // fileType only requires the first 4100 bytes to check the type.
    const buffSlice = data.slice(0, 4100);
    const type = await fromBuffer(buffSlice);
    if (type) {
      logger.info(
        `detected content type: ${type.mime} for "${keyspace}"."${table}"`,
        req,
      );
      sendFile(res, type.mime, `${filename}.${type.ext}`, data);
    } else {
      logger.info(
        `unable to detect content type for "${keyspace}"."${table}", checking for text content...`,
      );

      // if we can't detect the content type, the file may actually be text,
      // so perform additional check to set mime type.
      if (isText(null, data)) {
        return sendFile(res, 'application/text', `${filename}.txt`, data);
      } else {
        logger.warn(
          `non-text content found in "${keyspace}"."${table}", returning raw data`,
          req,
        );
        return sendFile(res, 'application/octet-stream', filename, data);
      }
    }
  } catch (err) {
    logger.error(
      `failed to retrieve binary column data from "${keyspace}"."${table}"
            due to: "${err.message}"`,
      err,
    );
    next(err);
  }
});

router.use('/:table/keys', keys);

export default router;
