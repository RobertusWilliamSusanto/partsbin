import { Router } from 'express';
import { componentController } from '../controllers/componentController.js';
import { validateUuidParam } from '../middlewares/validateUuid.js';

const router = Router();

// Validasi format UUID untuk seluruh parameter :id sebelum masuk ke controller
router.param('id', validateUuidParam);

router.get('/', componentController.getAll);
router.get('/:id', componentController.getById);
router.post('/', componentController.create);
router.put('/:id', componentController.update);
router.patch('/:id/stock', componentController.updateStock);
router.delete('/:id', componentController.remove);

export default router;
