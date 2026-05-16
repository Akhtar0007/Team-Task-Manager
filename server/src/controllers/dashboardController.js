const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getStats = async (req, res, next) => {
  try {
    let tasks;

    if (req.user.role === 'SUPER_ADMIN') {
      tasks = await prisma.task.findMany();
    } else {
      const memberships = await prisma.projectMember.findMany({
        where: { userId: req.user.id },
        select: { projectId: true }
      });

      const ids = memberships.map(m => m.projectId);

      tasks = await prisma.task.findMany({
        where: { projectId: { in: ids } }
      });
    }

    const projectIds = [...new Set(tasks.map(t => t.projectId))];
    const assigneeIds = [...new Set(tasks.map(t => t.assigneeId).filter(Boolean))];
    const [projects, assignees] = await Promise.all([
      projectIds.length > 0
        ? prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true }
          })
        : [],
      assigneeIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: assigneeIds } },
            select: { id: true, name: true, email: true }
          })
        : []
    ]);
    const projectById = Object.fromEntries(projects.map(project => [project.id, project]));
    const assigneeById = Object.fromEntries(assignees.map(user => [user.id, user]));
    const hydrateTask = task => ({
      ...task,
      project: projectById[task.projectId] || { id: task.projectId, name: 'Unknown project' },
      assignee: task.assigneeId ? assigneeById[task.assigneeId] || null : null
    });
    const totalTasks = tasks.length;
    const tasksByStatus = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      REVIEW: tasks.filter(t => t.status === 'REVIEW').length,
      DONE: tasks.filter(t => t.status === 'DONE').length
    };

    const now = new Date();
    const overdueTasks = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    const myTasks = tasks.filter(t => t.assigneeId === req.user.id);
    const myOverdueTasks = myTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    const response = {
      totalTasks,
      tasksByStatus,
      overdueCount: overdueTasks.length,
      myTaskCount: myTasks.length,
      myOverdueCount: myOverdueTasks.length,
      overdueTasks: overdueTasks.slice(0, 10).map(hydrateTask),
      myTasks: myTasks.slice(0, 10).map(hydrateTask),
      projectCount: projectIds.length
    };

    if (req.user.role === 'SUPER_ADMIN') {
      const [totalUsers, totalProjects, recentUsers, recentActivities] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, createdAt: true }
        }),
        prisma.activityLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' }
        })
      ]);
      const activityUserIds = [...new Set(recentActivities.map(log => log.userId).filter(Boolean))];
      const activityUsers = activityUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: activityUserIds } },
            select: { id: true, name: true, email: true }
          })
        : [];
      const activityUserById = Object.fromEntries(activityUsers.map(user => [user.id, user]));

      const doneTasks = await prisma.task.findMany({
        where: { status: 'DONE' },
        select: { assigneeId: true }
      });
      const performerCounts = {};
      doneTasks.forEach(t => {
        if (t.assigneeId) {
          performerCounts[t.assigneeId] = (performerCounts[t.assigneeId] || 0) + 1;
        }
      });
      const topPerformerIds = Object.entries(performerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0]);
      const topPerformers = topPerformerIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: topPerformerIds } },
            select: { id: true, name: true, email: true }
          })
        : [];
      const topPerformersById = Object.fromEntries(topPerformers.map(user => [user.id, user]));

      response.totalUsers = totalUsers;
      response.totalProjects = totalProjects;
      response.recentUsers = recentUsers;
      response.recentActivities = recentActivities.map(log => ({
        ...log,
        user: activityUserById[log.userId] || { id: log.userId, name: 'Unknown user' }
      }));
      response.topPerformers = topPerformerIds.map(id => ({
        ...topPerformersById[id],
        _count: { assignedTasks: performerCounts[id] || 0 }
      })).filter(user => user.id);
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
