const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const taskIncludes = {
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  files: {
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const { projectId } = req.params;

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
      if (membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only admin or super admin can create tasks' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        createdById: req.user.id
      },
      include: taskIncludes
    });

    res.status(201).json(task);
    await logActivity(req.user.id, 'CREATE', 'Task', task.id, `Created task "${task.title}"`);
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

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
      if (membership.role !== 'ADMIN' && task.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'Only admin or assignee can update this task' });
      }
    }

    const { title, description: desc, status: st, priority, dueDate, assigneeId } = req.body;
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(desc !== undefined && { description: desc }),
        ...(st !== undefined && { status: st }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId })
      },
      include: taskIncludes
    });

    res.json(updated);
    const changes = [];
    if (st && st !== task.status) changes.push(`status → ${st}`);
    if (title && title !== task.title) changes.push('title changed');
    await logActivity(req.user.id, 'UPDATE', 'Task', task.id, `Updated task "${updated.title}"${changes.length ? ': ' + changes.join(', ') : ''}`);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
      });
      if (!membership || membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
    await logActivity(req.user.id, 'DELETE', 'Task', req.params.id, `Deleted task "${task.title}"`);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, update, remove };
