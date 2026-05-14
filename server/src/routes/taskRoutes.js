const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { create, update, remove } = require('../controllers/taskController');

const router = Router();

router.use(authenticate);

router.post(
  '/project/:projectId',
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  create
);

router.put(
  '/:id',
  [body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty')],
  update
);

router.delete('/:id', remove);

module.exports = router;
