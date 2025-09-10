import { Router, Request, Response } from 'express';
import multer from 'multer';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Database } from '../config/database';
import { Readable } from 'stream';

const router = Router();
const database = Database.getInstance();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Upload PDF file
router.post('/upload', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file provided'
      });
    }

    const gridFS = database.getGridFS();
    const uploadStream = gridFS.openUploadStream(req.file.originalname, {
      contentType: 'application/pdf',
      metadata: {
        uploadDate: new Date(),
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      res.json({
        success: true,
        data: {
          fileId: uploadStream.id.toString(),
          fileName: req.file!.originalname,
          size: req.file!.size
        }
      });
    });

    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload file'
      });
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Stream PDF file
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const gridFS = database.getGridFS();

    // Find file metadata
    const files = await gridFS.find({ _id: new ObjectId(fileId) }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const file = files[0];
    
    // Set appropriate headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': file.length.toString(),
      'Content-Disposition': `inline; filename="${file.filename}"`
    });

    // Create download stream
    const downloadStream = gridFS.openDownloadStream(new ObjectId(fileId));
    
    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to stream file'
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('File stream error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete PDF file
router.delete('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const gridFS = database.getGridFS();

    await gridFS.delete(new ObjectId(fileId));

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

export default router;