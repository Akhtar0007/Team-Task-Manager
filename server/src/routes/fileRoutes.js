const { Router } = require('express');
const multer = require('multer');
const authenticate = require('../middleware/auth');
const { upload, uploadMultiple, remove, download } = require('../controllers/fileController');

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.use(authenticate);

router.post('/task/:taskId', uploadMiddleware.single('file'), upload);
router.post('/task/:taskId/multiple', uploadMiddleware.array('files', 10), uploadMultiple);
router.get('/download/:fileId', download);
router.delete('/:fileId', remove);

module.exports = router;
