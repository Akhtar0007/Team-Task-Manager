const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/team_task_manager?directConnection=true';

let client = null;
let bucket = null;

async function getBucket() {
  if (bucket) return bucket;
  client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  return bucket;
}

async function uploadToGridFS(filename, contentType, buffer) {
  const b = await getBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = b.openUploadStream(filename, { contentType });
    uploadStream.end(buffer);
    uploadStream.on('finish', (file) => resolve(file._id.toString()));
    uploadStream.on('error', reject);
  });
}

async function downloadFromGridFS(fileId) {
  const b = await getBucket();
  const _id = ObjectId.createFromHexString(fileId);
  const files = await b.find({ _id }).toArray();
  if (!files.length) throw new Error('File not found in GridFS');
  const file = files[0];
  const chunks = [];
  const downloadStream = b.openDownloadStream(_id);
  return new Promise((resolve, reject) => {
    downloadStream.on('data', (chunk) => chunks.push(chunk));
    downloadStream.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: file.contentType, filename: file.filename }));
    downloadStream.on('error', reject);
  });
}

async function deleteFromGridFS(fileId) {
  const b = await getBucket();
  try { await b.delete(ObjectId.createFromHexString(fileId)); } catch {}
}

module.exports = { uploadToGridFS, downloadFromGridFS, deleteFromGridFS };
