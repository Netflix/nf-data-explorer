import clusters from '@/routes/datastores/cassandra/clusters';
import features from '@/routes/datastores/cassandra/features';
import { Router } from 'express';

const router = Router();

router.use('/clusters', clusters);
router.use('/features', features);

export default router;
