import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const prisma = new PrismaClient();

// Get recent activities
router.get(
  '/recent',
  asyncHandler(async (_req: Request, res: Response) => {
    // For now, we'll create some mock activities based on recent business updates
    // In a real application, you'd have a separate activities table
    const recentOrganizations = await prisma.organization.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: true,
      }
    });

    const activities = recentOrganizations.map((org, index) => ({
      id: `activity-${org.id}`,
      business: org.name,
      action: index === 0 ? 'Profile updated' : 
              index === 1 ? 'New connection request' : 
              index === 2 ? 'Verification in progress' : 
              'New business registered',
      time: `${index + 1} ${index === 0 ? 'hour' : 'day'}${index === 0 ? '' : 's'} ago`,
      type: index === 0 ? 'business_update' : 
            index === 1 ? 'new_connection' : 
            index === 2 ? 'verification' : 
            'registration',
      businessId: org.id,
    }));

    res.json({ activities });
  })
);

// Get user-specific activities
router.get(
  '/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Get activities related to the user's organization
    const userOrg = await prisma.organization.findFirst({
      where: { userId },
      include: {
        user: true,
      }
    });

    if (!userOrg) {
      return res.json({ activities: [] });
    }

    const activities = [
      {
        id: `user-activity-1`,
        business: userOrg.name,
        action: 'Profile updated',
        time: '2 hours ago',
        type: 'business_update',
        businessId: userOrg.id,
      },
      {
        id: `user-activity-2`,
        business: userOrg.name,
        action: 'New connection request received',
        time: '1 day ago',
        type: 'new_connection',
        businessId: userOrg.id,
      }
    ];

    res.json({ activities });
  })
);

// Create a new activity (for future use)
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { business, action, type, businessId } = req.body;

    // In a real application, you'd save this to an activities table
    const activity = {
      id: `activity-${Date.now()}`,
      business,
      action,
      time: 'Just now',
      type,
      businessId,
    };

    res.status(201).json({ activity });
  })
);

export default router; 