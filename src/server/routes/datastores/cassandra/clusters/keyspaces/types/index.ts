import { Request, Router } from 'express';

const router = Router();

router.get('/', async (req: Request, res, next) => {
  try {
    const types = await req.cassandraApi.getTypes(req.keyspaceName);
    res.json(types);
  } catch (err) {
    next(err);
  }
});

export default router;
