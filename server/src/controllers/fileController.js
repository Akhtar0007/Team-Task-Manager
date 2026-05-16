const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('../utils/activityLog');

const prisma = new PrismaClient();

const upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId: task.projectId, userId: req.user.id }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }

    const file = await prisma.taskFile.create({
      data: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        path: req.file.filename,
        taskId,
        uploadedById: req.user.id
      }
    });

    res.status(201).json(file);
    await logActivity(req.user.id, 'UPLOAD', 'File', file.id, `Uploaded file "${file.name}"`);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const file = await prisma.taskFile.findUnique({
      where: { id: req.params.fileId }
    });

    if (!file) return res.status(404).json({ error: 'File not found' });

    const task = await prisma.task.findUnique({ where: { id: file.taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const membership = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: req.user.id }
    });

    const isProjectAdmin = membership && membership.role === 'ADMIN';
    if (req.user.role !== 'SUPER_ADMIN' && !isProjectAdmin) {
      return res.status(403).json({ error: 'Only admin or super admin can delete files' });
    }

    const filePath = path.join(__dirname, '../../uploads', file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.taskFile.delete({ where: { id: req.params.fileId } });
    res.json({ message: 'File deleted' });
    await logActivity(req.user.id, 'DELETE', 'File', req.params.fileId, `Deleted file "${file.name}"`);
  } catch (error) {
    next(error);
  }
};

const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId: task.projectId, userId: req.user.id }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }

    const files = await Promise.all(
      req.files.map(file =>
        prisma.taskFile.create({
          data: {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            path: file.filename,
            taskId,
            uploadedById: req.user.id
          }
        })
      )
    );

    res.status(201).json(files);
    await logActivity(req.user.id, 'UPLOAD', 'Task', taskId, `Uploaded ${files.length} file(s) to task "${task.title}"`);
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, uploadMultiple, remove };
