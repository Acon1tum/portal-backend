// auth/check-session.ts
import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  if ((req.session as any).user) {
    // User is authenticated, return session data
    res.json({ user: (req.session as any).user });
  } else {
    // No session, return null or error
    res.json({ user: null });
  }
});

export default router;
