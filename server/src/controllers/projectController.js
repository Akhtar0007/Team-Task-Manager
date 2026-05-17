const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdBy: req.user.id
      }
    });

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: req.user.id,
        role: 'ADMIN'
      }
    });

    const enriched = await prisma.project.findUnique({
      where: { id: project.id }
    });
    const members = await prisma.projectMember.findMany({
      where: { projectId: project.id }
    });

    const creatorUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true }
    });

    const enrichedMembers = await Promise.all(
      members.map(async (m) => {
        const u = await prisma.user.findUnique({
          where: { id: m.userId },
          select: { id: true, name: true, email: true, role: true }
        });
        return { ...m, user: u };
      })
    );

    res.status(201).json({
      ...enriched,
      creator: creatorUser,
      members: enrichedMembers
    });
    await logActivity(req.user.id, 'CREATE', 'Project', project.id, `Created project "${project.name}"`);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    let projectIds;

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      const allProjects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(allProjects);
    } else {
      const memberships = await prisma.projectMember.findMany({
        where: { userId: req.user.id },
        select: { projectId: true }
      });
      projectIds = memberships.map(m => m.projectId);
      const projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(projects);
    }
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';
    if (!isMember) {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId: project.id, userId: req.user.id }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId: project.id }
    });
    const enrichedMembers = await Promise.all(
      members.map(async (m) => {
        const u = await prisma.user.findUnique({
          where: { id: m.userId },
          select: { id: true, name: true, email: true, role: true }
        });
        return { ...m, user: u };
      })
    );

    const creatorUser = await prisma.user.findUnique({
      where: { id: project.createdBy },
      select: { id: true, name: true, email: true, role: true }
    });

    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' }
    });
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const assignee = task.assigneeId
          ? await prisma.user.findUnique({ where: { id: task.assigneeId }, select: { id: true, name: true, email: true, role: true } })
          : null;
        const createdBy = await prisma.user.findUnique({ where: { id: task.createdById }, select: { id: true, name: true, email: true, role: true } });
        const labels = await prisma.taskLabel.findMany({ where: { taskId: task.id } });
        const enrichedLabels = await Promise.all(
          labels.map(async (l) => {
            const label = await prisma.label.findUnique({ where: { id: l.labelId } });
            return { ...l, label };
          })
        );
        const files = await prisma.taskFile.findMany({ where: { taskId: task.id } });
        const comments = await prisma.taskComment.findMany({ where: { taskId: task.id }, orderBy: { createdAt: 'asc' } });
        const subtasks = await prisma.subTask.findMany({ where: { taskId: task.id } });
        const timeEntries = await prisma.timeEntry.findMany({ where: { taskId: task.id } });
        const watchers = await prisma.taskWatcher.findMany({ where: { taskId: task.id } });
        const enrichedWatchers = await Promise.all(
          watchers.map(async (w) => {
            const u = await prisma.user.findUnique({ where: { id: w.userId }, select: { id: true, name: true, email: true, role: true } });
            return { ...w, user: u };
          })
        );
        return { ...task, assignee, createdBy, labels: enrichedLabels, files, comments, subtasks, timeEntries, watchers: enrichedWatchers };
      })
    );

    const phases = await prisma.phase.findMany({ where: { projectId: project.id } });
    const labels = await prisma.label.findMany({ where: { projectId: project.id } });
    const issues = await prisma.issue.findMany({ where: { projectId: project.id } });

    res.json({
      ...project,
      creator: creatorUser,
      members: enrichedMembers,
      tasks: enrichedTasks,
      phases,
      labels,
      issues
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId: req.params.id, userId: req.user.id
        }
      });
      if (!membership || membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name: req.body.name, description: req.body.description }
    });

    res.json(project);
    await logActivity(req.user.id, 'UPDATE', 'Project', project.id, `Updated project "${project.name}"`);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && project.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
    await logActivity(req.user.id, 'DELETE', 'Project', req.params.id, `Deleted project "${project.name}"`);
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found' });

    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: req.params.id, userId: userToAdd.id
      }
    });

    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        userId: userToAdd.id,
        role: role || 'MEMBER'
      }
    });

    res.status(201).json(member);
    await logActivity(req.user.id, 'ADD_MEMBER', 'Project', req.params.id, `Added ${userToAdd.name} as ${role || 'MEMBER'}`);
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const membership = await prisma.projectMember.findUnique({ where: { id: memberId } });
    if (!membership) return res.status(404).json({ error: 'Member not found' });

    const project = await prisma.project.findUnique({ where: { id: membership.projectId } });
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && project.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.projectMember.delete({ where: { id: memberId } });
    res.json({ message: 'Member removed' });
    await logActivity(req.user.id, 'REMOVE_MEMBER', 'Project', membership.projectId, `Removed member from project`);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, update, remove, addMember, removeMember };
