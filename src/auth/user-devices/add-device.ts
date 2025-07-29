import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Extend Express's Request to include the user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// Custom Authentication Middleware for this router:
// Reads the 'x-user-id' header and sets req.user if available.
router.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];
  if (userId && typeof userId === 'string') {
    req.user = { userId };
  }
  next();
});

// Async error handling helper with explicit types
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return fn(req, res, next).catch(next);
  };
};

// POST /user/devices
// Expects the client to send { browserFingerprint: string }
// and a custom header 'x-user-id' with the user id.
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log("user", req.user);
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: No user id provided' });
      return;
    }

    const { visitorId, browser } = req.body;
    if (!visitorId) {
      res.status(400).json({ error: 'browserFingerprint is required' });
      return;
    }

    // Get the device IP (supporting proxies if needed)
    const deviceIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';

    // UserDevice model not available in current schema
    res.status(501).json({ error: 'Device tracking feature not implemented' });
  })
);

export default router;
