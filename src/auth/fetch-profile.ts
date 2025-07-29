import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Async error handling helper with explicit types
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return fn(req, res, next).catch(next);
  };
};

// GET /auth/profile/:id
router.get( 
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Fetch the user including their accounts (role is now an enum field, not a relation)
    const userProfile = await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: true, // Include accounts
        // role is now an enum field, so no need to include it
      },
    });

    if (!userProfile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(userProfile);
  })
);

export default router;
