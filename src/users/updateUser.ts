import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Update user profile (including profile picture and cover photo)
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate the user ID format
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Only allow updating specific fields for security
    const allowedFields = ['name', 'profilePicture', 'coverPhoto', 'sex', 'userType', 'currentJobStatus'];
    const filteredData: any = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: filteredData,
      select: {
        id: true,
        email: true,
        name: true,
        sex: true,
        role: true,
        userType: true,
        currentJobStatus: true,
        profilePicture: true,
        coverPhoto: true,
        isEmailVerified: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.status(500).json({ error: 'An error occurred while updating the user.' });
  }
});

export default router;
