const { Router } = require('express');
const multer = require('multer');
const authenticate = require('../middleware/auth');
const { uploadMultiple, getByProject, remove, download } = require('../controllers/projectDocumentController');

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = Router();

router.use(authenticate);

router.post('/project/:projectId', uploadMiddleware.array('files', 20), uploadMultiple);
router.get('/project/:projectId', getByProject);
router.get('/download/:documentId', download);
router.delete('/:documentId', remove);

module.exports = router;
