const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

const checkProjectAccess = async (projectId, userId, role) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  if (role === 'Admin') return project;
  const isMember = project.members.some(m => m.toString() === userId.toString());
  return isMember ? project : null;
};

exports.getTasksByProject = async (req, res, next) => {
  try {
    const project = await checkProjectAccess(req.params.projectId, req.user._id, req.user.role);
    if (!project) return res.status(403).json({ message: 'Access denied or project not found' });

    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, projectId, assignedTo, priority, dueDate } = req.body;

    const project = await checkProjectAccess(projectId, req.user._id, req.user.role);
    if (!project) return res.status(403).json({ message: 'Access denied or project not found' });

    // Only admin can assign tasks
    if (assignedTo && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can assign tasks' });
    }

    const task = await Task.create({
      title, description, projectId, assignedTo: assignedTo || null,
      createdBy: req.user._id, priority, dueDate
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await checkProjectAccess(task.projectId, req.user._id, req.user.role);
    if (!project) return res.status(403).json({ message: 'Access denied' });

    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    // Members can only update status
    if (req.user.role === 'Member') {
      if (title || description || priority || dueDate || assignedTo) {
        return res.status(403).json({ message: 'Members can only update task status' });
      }
      if (status) task.status = status;
    } else {
      // Admin can update all fields
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json(task);
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
