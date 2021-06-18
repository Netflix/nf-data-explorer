import admin from '@/routes/admin';
import datastores from '@/routes/datastores';
import env from '@/routes/env';
import i18n from '@/routes/i18n';
import user from '@/routes/user';
import AdminCredentialsRequiredError from '@/services/datastores/base/errors/AdminCredentialsRequiredError';
import { ADMIN_MEMBERS } from '@/shared/shared-constants';
import { NextFunction, Request, Response, Router } from 'express';

const router = Router();

/**
 * Middleware function that requires a user to be an administrator to perform the function.
 * Currently, uses a simple white list of administrator emails.
 */
function isAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user && ADMIN_MEMBERS.indexOf(req.user.email) >= 0) {
    return next();
  }
  return next(new AdminCredentialsRequiredError());
}

router.use('/env', env);
router.use('/i18n', i18n);
router.use('/user', user);
router.use('/datastores', datastores);

router.use('/admin', [isAdmin], admin);

export default router;
