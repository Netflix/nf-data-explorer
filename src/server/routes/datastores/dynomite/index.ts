import clusters from '@/routes/datastores/dynomite/clusters';
import { Router } from 'express';

const router = Router();

router.use('/clusters', clusters);

export default router;
