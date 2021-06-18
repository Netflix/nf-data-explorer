import setupLogger from '@/config/logger';
import { Request, Router } from 'express';

const logger = setupLogger(module);
const router = Router();

/**
 * Adds fields to an aggregated key type (e.g. hash, list, set, etc.).
 * If the key doesn't exist, the key will be created. Expects POST body
 * to include:
 * {
 *   key: 'key-name',
 *   type: 'hash',
 *   fields: [{
 *      field: 'field-name',
 *      value: 'field-value'
 *   }]
 * }
 */
router.post('/:key(*)', async (req: Request, res, next) => {
  const key = req.params.key;
  const { type, values } = req.body;
  logger.info(
    `adding new fields "${JSON.stringify(values)}" to key "${key}" (${type})`,
    req,
  );
  try {
    const result = req.dynomiteApi.addFields(type, key, values);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Updates an existing aggregated key type (e.g. hash, list, set, etc.).
 * Key must exist. Expects POST body to include:
 * {
 *   key: 'key-name',
 *   fields: [{
 *      field: 'field-name',
 *      value: 'field-value'
 *   }]
 * }
 */
router.put('/:key(*)', async (req: Request, res, next) => {
  const key = req.params.key;
  const values = req.body.values;
  logger.info(
    `updating existing field "${JSON.stringify(values)}" on key "${key}"`,
    req,
  );
  try {
    const result = await req.dynomiteApi.updateFields(key, values);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Deletes fields from an existing aggregated key type (e.g. hash, list, set, etc.).
 * Note, deleting all fields from a key will delete the key itself.
 */
router.delete('/:key(*)', async (req: Request, res, next) => {
  const key = req.params.key;
  const values = req.body.values;
  logger.info(`deleting fields "${values}" from key "${key}"`, req);
  try {
    await req.dynomiteApi.deleteFields(key, values);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
