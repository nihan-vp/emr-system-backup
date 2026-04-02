import { Router } from 'express';

import {
  getClinicState,
  getHealth,
  replaceClinicCollection,
  resetClinicCollections
} from '../controllers/clinicStateController.js';

const router = Router();

router.get('/health', getHealth);
router.get('/state', getClinicState);
router.put('/state/:collection', replaceClinicCollection);
router.post('/state/reset', resetClinicCollections);

export default router;