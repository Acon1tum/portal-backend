// RolesAndPermission/role.ts

import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';

const router = Router();

// GET endpoint for fetching all available roles (enum values)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Return all available UserRole enum values
    const roles = Object.values(UserRole).map(role => ({
      name: role,
      value: role,
      description: getRoleDescription(role)
    }));
    
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'An error occurred while fetching roles.' });
  }
});

// Helper function to get role descriptions
function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.VISITOR]: 'Basic visitor access',
    [UserRole.JOBSEEKER]: 'Job seeker looking for maritime positions',
    [UserRole.MANNING_AGENCY]: 'Manning agency providing crew services',
    [UserRole.SUPERADMIN]: 'Super administrator with full access',
    [UserRole.EXHIBITOR]: 'Exhibitor at maritime events',
    [UserRole.SPONSOR]: 'Sponsor of maritime events and services'
  };
  
  return descriptions[role] || 'No description available';
}

export default router;
