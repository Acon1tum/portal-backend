import express, { Request, Response, NextFunction } from 'express';
import MigrationService from '../services/migrationService';
import SupabaseService, { supabase } from '../services/supabaseService';

const router = express.Router();

// Async error handling helper with explicit types (matching your existing pattern)
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return fn(req, res, next).catch(next);
  };
};

// Middleware to check if user is admin (you can customize this)
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const session = req.session as any;
  if (!session.user || session.user.role !== 'SUPERADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

// Check migration status for a specific user
router.get('/status/:email', requireAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.params;
  const status = await MigrationService.getMigrationStatus(email);

  res.json({
    email,
    ...status
  });
}));

// Check if user needs migration
router.get('/needs-migration/:email', requireAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.params;
  const needsMigration = await MigrationService.needsMigration(email);

  res.json({
    email,
    needsMigration
  });
}));

// Manual migration for a specific user
router.post('/migrate-user', requireAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  // First authenticate with Supabase
  const supabaseAuth = await SupabaseService.authenticateUser(email, password);

  if (!supabaseAuth.success || !supabaseAuth.user) {
    res.status(401).json({ error: 'Invalid Supabase credentials' });
    return;
  }

  // Perform migration
  const result = await MigrationService.migrateUserFromSupabase(
    supabaseAuth.user,
    supabaseAuth.userDetails
  );

  if (result.success) {
    res.json({
      success: true,
      message: result.message,
      user: result.user
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error,
      message: result.message
    });
  }
}));

// Bulk migration for multiple users
router.post('/bulk-migrate', requireAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    res.status(400).json({ error: 'Emails array is required' });
    return;
  }

  // Limit bulk operations to prevent abuse
  if (emails.length > 100) {
    res.status(400).json({ error: 'Maximum 100 emails allowed per bulk operation' });
    return;
  }

  const result = await MigrationService.bulkMigrateUsers(emails);

  res.json({
    success: true,
    ...result
  });
}));

// Get all migrated users
router.get('/migrated-users', requireAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const migratedUsers = await prisma.user.findMany({
    where: {
      migratedFromSupabase: true
    },
    select: {
      id: true,
      email: true,
      name: true,
      supabaseUserId: true,
      migrationDate: true,
      createdAt: true
    },
    orderBy: {
      migrationDate: 'desc'
    }
  });

  res.json({
    success: true,
    count: migratedUsers.length,
    users: migratedUsers
  });
}));

// Test Supabase connection
router.get('/test-connection', requireAdmin, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Try to connect to Supabase and perform a simple query
  const { data, error } = await supabase
    .from('UserAccount')
    .select('count')
    .limit(1);

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Supabase',
      details: error.message
    });
    return;
  }

  res.json({
    success: true,
    message: 'Successfully connected to Supabase',
    connectionTest: 'passed'
  });
}));

export default router;
