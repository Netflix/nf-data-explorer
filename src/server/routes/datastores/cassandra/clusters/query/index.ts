import setupLogger from '@/config/logger';
import EntityNotAuthorizedError from '@/model/errors/EntityNotAuthorizedError';
import { CassandraKeyspaceNotAccessible } from '@/services/datastores/cassandra/lib/errors';
import { truncateResults } from '@/services/datastores/cassandra/lib/utils/result-utils';
import {
  CassandraExportFormat,
  IKeyQueryOptions,
  TruncationOption,
} from '@/services/datastores/cassandra/typings/cassandra';
import { EntityType } from '@/typings/enums';
import { getCassandraAccess } from '@/utils/cde-utils';
import { getQueryAsString } from '@/utils/request-utils';
import { Request, Router } from 'express';
import CassandraResultsExporter from '../keyspaces/tables/keys/CassandraResultsExporter';

const logger = setupLogger(module);

const router = Router();

router.post('/', async (req: Request, res, next) => {
  const { user, cluster, body } = req;
  logger.info(`submitted free form query: ${body.query}`, req);
  const keyspaces = await req.cassandraApi.getKeyspaces();
  const clusterAccess = await getCassandraAccess(user, cluster, keyspaces);
  try {
    const generateFile = getQueryAsString(req, 'generateFile');
    const truncate = getQueryAsString<TruncationOption>(req, 'truncate');
    const format = getQueryAsString<CassandraExportFormat>(req, 'format');

    const keyQueryOptions: IKeyQueryOptions = req.body.options;
    const result = await req.cassandraApi.execute(
      req.body.query.trim(),
      clusterAccess,
      req,
      {
        enforceQueryRestrictions: true,
        includeSchema: true,
        keyQueryOptions,
      },
    );

    const { columns, rows, schema } = result;
    if (format && schema) {
      new CassandraResultsExporter(schema, cluster, req.cassandraApi)
        .build(columns, rows, {
          primaryKey: {},
          options: keyQueryOptions,
        })
        .send(res, format, !!generateFile && generateFile === 'true');
    } else if (truncate && schema) {
      res.json(truncateResults(result, schema, truncate));
    } else {
      res.json(result);
    }
  } catch (err) {
    if (err instanceof CassandraKeyspaceNotAccessible) {
      return next(
        new EntityNotAuthorizedError(
          cluster,
          EntityType.KEYSPACE,
          err.keyspace,
        ),
      );
    }
    logger.info(
      `failed to execute query "${req.body.query}" due to: "${err.message}"`,
      req,
    );
    next(err);
  }
});

export default router;
