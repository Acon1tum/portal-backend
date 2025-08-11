// users/user.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        accounts: true, // Include all accounts associated with the user
        // role is now an enum field, so no need to include it
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile (including profile picture and cover photo)
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  console.log('PATCH request received for user update');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  const { id } = req.params;
  const { profilePicture, coverPhoto, name, email, sex, role, userType, currentJobStatus } = req.body;

  console.log('Updating user profile:', { id, profilePicture: profilePicture ? 'base64_data' : null, coverPhoto: coverPhoto ? 'base64_data' : null, name, email });

  const updateData: any = {};
  
  // Validate base64 data if provided
  if (profilePicture !== undefined) {
    if (profilePicture && !profilePicture.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid profile picture format. Must be base64 data URL.' });
    }
    updateData.profilePicture = profilePicture;
  }
  
  if (coverPhoto !== undefined) {
    if (coverPhoto && !coverPhoto.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid cover photo format. Must be base64 data URL.' });
    }
    updateData.coverPhoto = coverPhoto;
  }
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (sex !== undefined) updateData.sex = sex;
  if (role !== undefined) updateData.role = role;
  if (userType !== undefined) updateData.userType = userType;
  if (currentJobStatus !== undefined) updateData.currentJobStatus = currentJobStatus;

  console.log('Update data keys:', Object.keys(updateData));

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      accounts: true,
    },
  });

  console.log('User updated successfully:', updatedUser.id);
  res.json(updatedUser);
}));

export default router;
