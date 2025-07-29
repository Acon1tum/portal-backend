import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'express-session'; // Importing express-session to use our session augmentation

// Import session types directly
import { UserRole, UserType, CurrentJobStatus } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Define session user type locally
interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  userType: UserType | null;
  currentJobStatus: CurrentJobStatus | null;
}

// Async error handling helper with explicit types
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return fn(req, res, next).catch(next);
  };
};

// Login endpoint: POST /auth/login
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find the user by email, including their accounts (role is now an enum field)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Look for an account that has a non-null password
    const account = user.accounts.find((acc: any) => acc.password);
    if (!account || !account.password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if the account status is INACTIVE
    if (account.status === 'INACTIVE') {
      res.status(403).json({ error: 'ACCOUNT IS INACTIVE' });
      return;
    }

    // Compare the provided password with the stored (hashed) password
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Store user details in the session using the new role-based structure
    // The session user object now follows the structure:
    // { id, email, name, role, userType, currentJobStatus }
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name || '', // Using empty string if name is null
      role: user.role, // Now directly the UserRole enum value
      userType: user.userType,
      currentJobStatus: user.currentJobStatus,
    };
    
    (req.session as any).user = sessionUser;

    // Save the session and return the user object as confirmation of a successful login
    req.session.save(() => {
      res.json({ user: (req.session as any).user });
    });
  })
);

export default router;
