import setupLogger from '@/config/logger';
import {
  getReqUrl,
  getQueryAsString,
  getQueryAsNumber,
} from '@/utils/request-utils';
import { Request, Router } from 'express';

const router = Router();

const logger = setupLogger(module);

/**
 * Queries for matching keys.
 *
 * Expects query string to include the following:
 *  - cursor
 *      The existing cursor to use. Each call to this endpoint will return a cursor which can be used to fetch the next
 *      set of results.
 *  - match
 *      The string to match. Note, the string is case-sensitive. Wilcards (*) can be included.
 *  - count
 *      The desired count to use when scanning for results.
 *  - pageSize
 *      The desired page size of results.
 */
router.get('/', async (req: Request, res, next) => {
  const cursorString = getQueryAsString(req, 'cursor');
  const cursor = cursorString && JSON.parse(cursorString);

  const match = getQueryAsString(req, 'match', '*');
  const count = getQueryAsNumber(req, 'count', 100);
  const pageSize = getQueryAsNumber(req, 'pageSize', 100);
  logger.info(`scanning for keys matching "${match}"`, req);

  try {
    const result = await req.dynomiteApi.getKeys(
      cursor,
      match,
      count,
      pageSize,
    );
    res.header(
      'Link',
      `<${getReqUrl(req)}?cursor=${JSON.stringify(result.cursor)}>; rel="next"`,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// NOTE: order of routes is important here since keys can contain slashes.

/**
 * Sets the expiration of a key (TTL). Query string must include a ttl parameter that specifies
 * the expiration in seconds. Pass null to expire immediately.
 */
router.put('/:key(*)/expire', async (req: Request, res, next) => {
  const key = req.params.key;
  const ttl = getQueryAsNumber(req, 'ttl');
  logger.info(`setting expiration for key: ${key}, ttl: ${ttl}`, req);

  try {
    await req.dynomiteApi.setExpiration(key, ttl);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * Persists an expiring key (i.e. a key with TTL set).
 */
router.put('/:key(*)/persist', async (req: Request, res, next) => {
  const key = req.params.key;
  logger.info(`persisting key: ${key}`, req);

  try {
    await req.dynomiteApi.setExpiration(key, undefined);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * Fetches a specific key by name. Note, key name is case-sensitive. Returns 404 if key can not be found.
 * Can optionally pass a "test" query param if the intent is to test for the presence of a key (prevents us from
 * logging an error).
 */
router.get('/:key(*)', async (req: Request, res, next) => {
  const key = req.params.key;
  const test = typeof req.query.test !== 'undefined';
  const operation = test ? 'checking key existence' : 'fetching';
  logger.info(`${operation} key: "${key}"`, req);

  try {
    const value = await req.dynomiteApi.getValue(key);
    res.json(value);
  } catch (err) {
    if (test) {
      return res.status(404).send();
    }
    next(err);
  }
});

/**
 * Creates a new simple key. Expects POST body to include:
 * {
 *  type: 'string',
 *  value: 'my-value'
 * }
 */
router.post('/:key(*)', async (req: Request, res, next) => {
  const key = req.params.key;
  const value = req.body.value;
  logger.info(`create new key: "${key}" (string), value: "${value}"`, req);

  try {
    await req.dynomiteApi.setValue(key, value);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * Updates an existing key. Expects POST body to include:
 * {
 *  value: 'new-value'
 * }
 */
router.put('/:key(*)', async (req: Request, res, next) => {
  const key = req.params.key;
  logger.info(`updating key: ${key}`, req);
  try {
    const result = await req.dynomiteApi.setValue(key, req.body.value);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Deletes an existing key by name.
 */
router.delete('/:key(*)', async (req: Request, res, next) => {
  const key = req.params.key;
  logger.info(`deleting key: ${key}`, req);
  try {
    const value = await req.dynomiteApi.deleteKey(key);
    res.json(value);
  } catch (err) {
    next(err);
  }
});

export default router;
