import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'express-session'; // Importing express-session to use our session augmentation

// Import session types directly
import { UserRole, UserType, CurrentJobStatus } from '@prisma/client';

// Import Supabase and migration services
import SupabaseService from '../services/supabaseService';
import MigrationService from '../services/migrationService';

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

    console.log(`🔍 Login attempt for email: ${email}`);
    console.log(`🔐 Password length from request: ${password.length}`);

    // First, try to find user in local database
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });

    let isLocalUser = false;
    let migrationResult = null;

    if (user) {
      // User exists locally, proceed with local authentication
      isLocalUser = true;
      
      // Look for an account that has a non-null password
      const account = user.accounts.find((acc: any) => acc.password);
      if (!account || !account.password) {
        console.log(`❌ No password found for user: ${email}`);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      console.log(`🔍 User found locally: ${email}`);
      console.log(`🔐 Stored password format: ${account.password.substring(0, 20)}...`);
      console.log(`🔐 Password length: ${account.password.length}`);

      // Check if the account status is INACTIVE
      if (account.status === 'INACTIVE') {
        console.log(`❌ Account is inactive for user: ${email}`);
        res.status(403).json({ error: 'ACCOUNT IS INACTIVE' });
        return;
      }

      // Compare the provided password with the stored (hashed) password
      console.log(`🔐 Attempting password comparison for user: ${email}`);
      const isMatch = await bcrypt.compare(password, account.password);
      console.log(`🔐 Password comparison result: ${isMatch}`);
      
      if (!isMatch) {
        console.log(`❌ Password mismatch for user: ${email}`);
        
        // If this is a migrated user, try Supabase authentication as fallback
        if (user.migratedFromSupabase) {
          console.log(`🔄 User was migrated from Supabase, trying Supabase authentication as fallback`);
          
          try {
            const supabaseAuth = await SupabaseService.authenticateUser(email, password);
            
            if (supabaseAuth.success && supabaseAuth.user) {
              console.log(`✅ Supabase authentication successful, updating local password`);
              
              // Update the local password with the correct one from Supabase
              const newHashedPassword = await bcrypt.hash(password, 12);
              await prisma.account.update({
                where: { id: account.id },
                data: { password: newHashedPassword }
              });
              
              console.log(`✅ Local password updated successfully`);
              
              // Continue with the login process
            } else {
              console.log(`❌ Supabase authentication also failed`);
              res.status(401).json({ error: 'Invalid credentials' });
              return;
            }
          } catch (error) {
            console.error('Supabase fallback authentication error:', error);
            res.status(401).json({ error: 'Invalid credentials' });
            return;
          }
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
          return;
        }
      }
      
      console.log(`✅ Password verified for user: ${email}`);
    } else {
      // User doesn't exist locally, try Supabase authentication
      try {
        const supabaseAuth = await SupabaseService.authenticateUser(email, password);
        
        if (supabaseAuth.success && supabaseAuth.user) {
          // User authenticated with Supabase, now migrate to local database
          migrationResult = await MigrationService.migrateUserFromSupabase(
            supabaseAuth.user,
            supabaseAuth.userDetails
          );

          if (migrationResult.success && migrationResult.user) {
            // Migration successful, get the newly created user
            user = await prisma.user.findUnique({
              where: { email },
              include: {
                accounts: true,
              },
            });
            
            if (!user) {
              res.status(500).json({ error: 'Migration successful but user not found' });
              return;
            }
          } else {
            res.status(500).json({ 
              error: 'Migration failed', 
              details: migrationResult.error 
            });
            return;
          }
        } else {
          // Neither local nor Supabase authentication worked
          res.status(401).json({ error: 'Invalid credentials' });
          return;
        }
      } catch (error) {
        console.error('Supabase authentication error:', error);
        res.status(500).json({ error: 'Authentication service error' });
        return;
      }
    }

    // At this point, we have a valid user (either local or migrated)
    if (!user) {
      res.status(500).json({ error: 'User not found after authentication' });
      return;
    }

    // Store user details in the session
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
      userType: user.userType,
      currentJobStatus: user.currentJobStatus,
    };
    
    (req.session as any).user = sessionUser;

    // Save the session and return the user object
    req.session.save(() => {
      const response: any = { 
        user: (req.session as any).user,
        isLocalUser,
        message: 'Login successful'
      };

      // Add migration info if this was a migrated user
      if (migrationResult && migrationResult.success) {
        response.migrationInfo = {
          migrated: true,
          message: migrationResult.message,
          supabaseUserId: user.supabaseUserId
        };
      }

      res.json(response);
    });
  })
);

export default router;
