const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');

exports.getProjects = async (req, res, next) => {
  try {
    const query = req.user.role === 'Admin'
      ? {}
      : { members: req.user._id };

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    next(err);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    if (req.user.role !== 'Admin' && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description } = req.body;
    const project = await Project.create({ name, description, createdBy: req.user._id });
    await project.populate('createdBy', 'name email');
    await project.populate('members', 'name email role');

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

exports.addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User already a member' });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.createdBy.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove project creator' });
    }

    project.members = project.members.filter(m => m.toString() !== userId);
    await project.save();
    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};
