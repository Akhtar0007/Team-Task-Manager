const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const { uploadToGridFS, downloadFromGridFS, deleteFromGridFS } = require('../utils/gridfs');

const prisma = new PrismaClient();

const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files provided' });
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findFirst({ where: { projectId, userId: req.user.id } });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
      if (membership.role !== 'ADMIN') return res.status(403).json({ error: 'Only admin or super admin can upload project documents' });
    }
    const documents = await Promise.all(
      req.files.map(async (f) => {
        const gridfsId = await uploadToGridFS(f.originalname, f.mimetype, f.buffer);
        return prisma.projectDocument.create({
          data: { name: f.originalname, size: f.size, type: f.mimetype, path: gridfsId, projectId, uploadedById: req.user.id }
        });
      })
    );
    res.status(201).json(documents);
    await logActivity(req.user.id, 'UPLOAD', 'Project', projectId, `Uploaded ${documents.length} document(s) to project`);
  } catch (error) {
    next(error);
  }
};

const getByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const documents = await prisma.projectDocument.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
    res.json(documents);
  } catch (error) {
    next(error);
  }
};

const download = async (req, res, next) => {
  try {
    const doc = await prisma.projectDocument.findUnique({ where: { id: req.params.documentId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const membership = await prisma.projectMember.findFirst({ where: { projectId: doc.projectId, userId: req.user.id } });
    if (req.user.role !== 'SUPER_ADMIN' && !membership) return res.status(403).json({ error: 'Not a project member' });
    const { buffer, contentType } = await downloadFromGridFS(doc.path);
    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `inline; filename="${doc.name}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const document = await prisma.projectDocument.findUnique({ where: { id: documentId } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    const membership = await prisma.projectMember.findFirst({ where: { projectId: document.projectId, userId: req.user.id } });
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN' || (membership && membership.role === 'ADMIN');
    if (!isAdmin) return res.status(403).json({ error: 'Only admin or super admin can delete documents' });
    await deleteFromGridFS(document.path);
    await prisma.projectDocument.delete({ where: { id: documentId } });
    res.json({ message: 'Document deleted' });
    await logActivity(req.user.id, 'DELETE', 'Project', document.projectId, `Deleted document "${document.name}"`);
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadMultiple, getByProject, download, remove };
