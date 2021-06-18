import setupLogger from '@/config/logger';
import { ADMIN_MEMBERS } from '@/shared/shared-constants';
import { Request, Response, Router } from 'express';

const logger = setupLogger(module);

const router = Router();

/**
 * Get user details.
 */
router.get('/', (req: Request, res: Response) => {
  logger.info('requesting user details', req);
  const userResponse = Object.assign({}, req.user, {
    isAdmin: ADMIN_MEMBERS.indexOf(req.user.email) >= 0,
  });
  res.json(userResponse);
});

export default router;
