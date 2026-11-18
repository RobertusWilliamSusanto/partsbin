import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';

const router = Router();

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.remove);

// Endpoint pengelolaan relasi item BOM pada proyek tertentu
router.post('/:id/items', projectController.addItem);
router.delete('/:id/items/:itemId', projectController.removeItem);

export default router;
