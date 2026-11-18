import { Router } from 'express';
import { componentController } from '../controllers/componentController.js';

const router = Router();

router.get('/', componentController.getAll);
router.get('/:id', componentController.getById);
router.post('/', componentController.create);
router.put('/:id', componentController.update);
router.patch('/:id/stock', componentController.updateStock);
router.delete('/:id', componentController.remove);

export default router;
