const router = require('express').Router();
const { body } = require('express-validator');
const { protect, requireAdmin } = require('../middleware/auth');
const {
  getProjects, getProject, createProject,
  addMember, removeMember, deleteProject
} = require('../controllers/projectController');

router.use(protect);

router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', requireAdmin, [
  body('name').trim().notEmpty().withMessage('Project name required')
], createProject);
router.post('/:id/members', requireAdmin, addMember);
router.delete('/:id/members/:userId', requireAdmin, removeMember);
router.delete('/:id', requireAdmin, deleteProject);

module.exports = router;
