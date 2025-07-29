import 'express-session';
import { UserRole, UserType, CurrentJobStatus } from '@prisma/client';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      userType: UserType | null;
      currentJobStatus: CurrentJobStatus | null;
    };
  }
}

// Also extend the Express namespace for better compatibility
declare global {
  namespace Express {
    interface Session {
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        userType: UserType | null;
        currentJobStatus: CurrentJobStatus | null;
      };
    }
  }
}
