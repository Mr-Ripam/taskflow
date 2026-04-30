const router = require('express').Router();
const { body } = require('express-validator');
const { protect, requireAdmin } = require('../middleware/auth');
const { getTasksByProject, createTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(protect);

router.get('/project/:projectId', getTasksByProject);
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title required'),
  body('projectId').notEmpty().withMessage('Project ID required')
], createTask);
router.patch('/:id', updateTask);
router.delete('/:id', requireAdmin, deleteTask);

module.exports = router;
