const Task = require('../models/Task');
const Project = require('../models/Project');

exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'Admin';
    const now = new Date();

    // Get accessible projects
    const projectQuery = isAdmin ? {} : { members: userId };
    const projects = await Project.find(projectQuery).select('_id name');
    const projectIds = projects.map(p => p._id);

    // Task stats
    const taskQuery = isAdmin ? { projectId: { $in: projectIds } } : { assignedTo: userId };
    
    const [total, completed, overdue, myTasks] = await Promise.all([
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'Done' }),
      Task.countDocuments({ ...taskQuery, dueDate: { $lt: now }, status: { $ne: 'Done' } }),
      Task.find({ assignedTo: userId })
        .populate('projectId', 'name')
        .populate('assignedTo', 'name')
        .sort({ dueDate: 1 })
        .limit(10)
    ]);

    // Status breakdown
    const statusBreakdown = await Task.aggregate([
      { $match: isAdmin ? { projectId: { $in: projectIds } } : { assignedTo: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Priority breakdown
    const priorityBreakdown = await Task.aggregate([
      { $match: isAdmin ? { projectId: { $in: projectIds } } : { assignedTo: userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      stats: {
        totalProjects: projects.length,
        totalTasks: total,
        completedTasks: completed,
        overdueTasks: overdue,
        inProgressTasks: total - completed - (await Task.countDocuments({ ...taskQuery, status: 'Todo' }))
      },
      myTasks,
      statusBreakdown,
      priorityBreakdown,
      recentProjects: projects.slice(0, 5)
    });
  } catch (err) {
    next(err);
  }
};
