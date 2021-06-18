import { changeLanguage } from '@/i18n';
import { Router } from 'express';

const router = Router();

router.post('/', (req, res, next) => {
  try {
    changeLanguage(req.body.language);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
