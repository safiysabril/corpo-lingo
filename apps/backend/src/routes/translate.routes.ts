import { Router } from 'express';
import { translate, getOptions, getHistory } from '../controllers/translate.controller';
import { validateTranslation } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';

const router: Router = Router();

router.get('/options', getOptions);
router.get('/history', authenticate, getHistory);
router.post('/', authenticate, validateTranslation, translate);

export default router;
