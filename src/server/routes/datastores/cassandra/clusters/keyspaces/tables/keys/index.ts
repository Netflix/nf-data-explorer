import { getConfig } from '@/config/configuration';
import setupLogger from '@/config/logger';
import { truncateResults } from '@/services/datastores/cassandra/lib/utils/result-utils';
import {
  CassandraExportFormat,
  IKeyQuery,
  IRowDetails,
  TruncationOption,
} from '@/services/datastores/cassandra/typings/cassandra';
import { getQueryAsString } from '@/utils/request-utils';
import { Request, Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import { promisify } from 'util';
import CassandraResultsExporter from './CassandraResultsExporter';

const { MAX_FILE_UPLOAD } = getConfig();
const readFile = promisify(fs.readFile);
const logger = setupLogger(module);

const router = Router();

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: MAX_FILE_UPLOAD,
  },
});

/**
 * Queries the specified table using the given primary key components.
 */
router.post('/', async (req: Request, res, next) => {
  const { cluster, keyspaceName, tableName, body, query } = req;
  logger.info(
    `fetching keys from table: ${keyspaceName}.${
      req.tableName
    }. params=${JSON.stringify(req.body)}`,
    req,
  );
  try {
    const pageState = getQueryAsString(req, 'pageState');
    const generateFile = getQueryAsString(req, 'generateFile');
    const truncate = getQueryAsString<TruncationOption>(req, 'truncate');
    const format = query.format as CassandraExportFormat;

    const filter: IKeyQuery = body;

    const keys = await req.cassandraApi.getKeys(
      keyspaceName,
      tableName,
      filter,
      pageState,
      req,
    );
    if (format) {
      const schema = await req.cassandraApi.getTable(keyspaceName, tableName);
      const { columns, rows } = keys;
      new CassandraResultsExporter(schema, cluster, req.cassandraApi)
        .build(columns, rows, body)
        .send(res, format, !!generateFile && generateFile === 'true');
    } else if (truncate) {
      const schema = await req.cassandraApi.getTable(keyspaceName, tableName);
      res.json(truncateResults(keys, schema, truncate));
    } else {
      res.json(keys);
    }
  } catch (err) {
    logger.error(
      `failed to fetch keys from table ${keyspaceName}.${req.tableName} due to: "${err.message}"`,
      err,
    );
    next(err);
  }
});

/**
 * Inserts a new record into the given table using the given primary key components.
 */
router.post('/create', upload.any(), async (req: Request, res, next) => {
  logger.info('inserting row', req);

  const { keyspaceName, tableName } = req;
  const schema = await req.cassandraApi.getTable(keyspaceName, tableName);
  const { columns } = schema;

  let row: IRowDetails = {};
  if (req.headers['content-type']?.includes('multipart')) {
    if (req.files && req.files instanceof Array) {
      const promises = req.files.map((file) => {
        return readFile(file.path).then((buffer) => ({
          field: file.fieldname,
          buffer,
        }));
      });
      const results = await Promise.all(promises);
      row = columns.reduce((prev, column) => {
        const { name } = column;
        prev[name] = {
          options: {
            encoding: req.body[`${name}.encoding`],
          },
          value: req.body[name],
        };
        return prev;
      }, {} as IRowDetails);

      results.forEach((result) => {
        row[result.field] = {
          options: {
            encoding: 'hex',
          },
          value: result.buffer,
        };
      });
    }
  } else {
    row = req.body.fields;
  }

  try {
    const success = await req.cassandraApi.insertKey(
      req.keyspaceName,
      req.tableName,
      row,
      req,
    );
    res.json({ success });
  } catch (err) {
    logger.error(
      `failed to insert into ${req.keyspaceName}.${req.tableName} due to: "${err.message}"`,
      err,
    );
    next(err);
  }
});

/**
 * Updates a record in the given table using the given primary key components.
 */
router.put('/', async (req: Request, res, next) => {
  logger.info('updating row', req);
  const { keyspaceName, tableName, body } = req;
  const { primaryKeyQuery, fields } = body;

  const query: IKeyQuery = primaryKeyQuery;
  try {
    const success = await req.cassandraApi.updateKey(
      keyspaceName,
      tableName,
      query,
      fields,
      req,
    );
    res.json({ success });
  } catch (err) {
    logger.error(
      `failed to update ${keyspaceName}.${tableName} due to: "${err.message}"`,
      err,
    );
    next(err);
  }
});

/**
 * Deletes an existing record given the primary key components.
 */
router.delete('/', async (req: Request, res, next) => {
  logger.info('deleting row', req);
  const { keyspaceName, tableName, body } = req;
  try {
    const success = await req.cassandraApi.deleteKey(
      keyspaceName,
      tableName,
      body.primaryKeyQuery,
      req,
    );
    res.json({ success });
  } catch (err) {
    logger.error(
      `failed to delete ${keyspaceName}.${tableName} due to: "${err.message}"`,
      err,
    );
    next(err);
  }
});

export default router;
