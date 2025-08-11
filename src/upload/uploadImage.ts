import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Upload image endpoint (base64)
router.post('/image', asyncHandler(async (req: Request, res: Response) => {
  const { image, type } = req.body;

  console.log('Image upload request received:', { type, imageLength: image?.length });

  if (!image) {
    return res.status(400).json({ 
      success: false, 
      error: 'No image data provided' 
    });
  }

  if (!type || !['profile', 'cover'].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid image type. Must be "profile" or "cover"' 
    });
  }

  // Validate file size (max 20MB)
  const maxSize = 20 * 1024 * 1024; // 20MB in bytes
  if (image.length > maxSize) {
    return res.status(400).json({ 
      success: false, 
      error: 'File size too large. Maximum size is 20MB.' 
    });
  }

  // Validate that it's a proper base64 data URL
  if (!image.startsWith('data:image/')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid image format. Must be a base64 data URL.' 
    });
  }

  // Validate base64 data format
  const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (!base64Regex.test(image)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid base64 format. Must be a valid image data URL.' 
    });
  }

  console.log('Base64 image received, returning for database storage');
  console.log('Image type detected:', image.match(/data:image\/([^;]+)/)?.[1]);

  // Return the base64 data directly for database storage
  res.json({
    success: true,
    url: image, // Return the full base64 data URL
    size: image.length,
    type: type
  });
}));

// Serve uploaded files (for backward compatibility with existing file URLs)
router.get('/uploads/:filename', asyncHandler(async (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
}));

export default router;
