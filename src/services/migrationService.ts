import { PrismaClient } from '@prisma/client';
import { SupabaseService, SupabaseUserAccount, SupabaseUserDetails } from './supabaseService';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface MigrationResult {
  success: boolean;
  user?: any;
  message: string;
  error?: string;
}

export class MigrationService {
  /**
   * Migrate user from Supabase to local database
   */
  static async migrateUserFromSupabase(
    supabaseUser: SupabaseUserAccount,
    supabaseUserDetails?: SupabaseUserDetails
  ): Promise<MigrationResult> {
    try {
      // Check if user already exists in local database
      const existingUser = await prisma.user.findUnique({
        where: { email: supabaseUser.email }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User already exists in local database',
          error: 'DUPLICATE_USER'
        };
      }

      // Start transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // Create user in local database
        const newUser = await tx.user.create({
          data: {
            email: supabaseUser.email,
            name: supabaseUserDetails 
              ? `${supabaseUserDetails.name?.first || ''} ${supabaseUserDetails.name?.last || ''}`.trim() || null
              : null,
            sex: supabaseUserDetails?.sex === 'FEMALE' ? 'FEMALE' : 'MALE',
            role: supabaseUserDetails?.userRole === 'SUPERADMIN' ? 'SUPERADMIN' : 'VISITOR',
            userType: supabaseUserDetails?.userType === 'SUPERADMIN' ? 'SUPERADMIN' : 'OTHERS',
            currentJobStatus: 'NOT_LOOKING', // Default status
            isEmailVerified: true, // Assume verified if coming from Supabase
            migratedFromSupabase: true,
            supabaseUserId: supabaseUser.id,
            migrationDate: new Date(),
          }
        });

        // Create account with hashed password
        const hashedPassword = await bcrypt.hash(supabaseUser.password, 12);
        await tx.account.create({
          data: {
            email: supabaseUser.email,
            password: hashedPassword,
            userId: newUser.id,
            status: 'ACTIVE',
          }
        });

        // If user details exist, create additional profile information
        if (supabaseUserDetails) {
          // You can extend this to create additional profile records
          // For now, we'll store basic info in the user record
          console.log('User details available for migration:', supabaseUserDetails);
        }

        return newUser;
      });

      return {
        success: true,
        user: result,
        message: 'User successfully migrated from Supabase'
      };

    } catch (error) {
      console.error('Migration error:', error);
      return {
        success: false,
        message: 'Failed to migrate user',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if user needs migration
   */
  static async needsMigration(email: string): Promise<boolean> {
    try {
      // Check if user exists in local database
      const localUser = await prisma.user.findUnique({
        where: { email }
      });

      // If user doesn't exist locally but exists in Supabase, migration is needed
      if (!localUser) {
        const existsInSupabase = await SupabaseService.userExists(email);
        return existsInSupabase;
      }

      return false;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Get migration status for a user
   */
  static async getMigrationStatus(email: string): Promise<{
    needsMigration: boolean;
    isMigrated: boolean;
    migrationDate?: Date;
    supabaseUserId?: string;
  }> {
    try {
      const localUser = await prisma.user.findUnique({
        where: { email },
        select: {
          migratedFromSupabase: true,
          migrationDate: true,
          supabaseUserId: true
        }
      });

      if (!localUser) {
        const existsInSupabase = await SupabaseService.userExists(email);
        return {
          needsMigration: existsInSupabase,
          isMigrated: false
        };
      }

      return {
        needsMigration: false,
        isMigrated: localUser.migratedFromSupabase,
        migrationDate: localUser.migrationDate || undefined,
        supabaseUserId: localUser.supabaseUserId || undefined
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return {
        needsMigration: false,
        isMigrated: false
      };
    }
  }

  /**
   * Bulk migration for multiple users (admin function)
   */
  static async bulkMigrateUsers(emails: string[]): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: MigrationResult[];
  }> {
    const results: MigrationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        const supabaseAuth = await SupabaseService.authenticateUser(email, '');
        if (supabaseAuth.success && supabaseAuth.user) {
          const result = await this.migrateUserFromSupabase(
            supabaseAuth.user,
            supabaseAuth.userDetails
          );
          
          if (result.success) {
            successful++;
          } else {
            failed++;
          }
          
          results.push(result);
        } else {
          failed++;
          results.push({
            success: false,
            message: 'Failed to authenticate with Supabase',
            error: 'AUTHENTICATION_FAILED'
          });
        }
      } catch (error) {
        failed++;
        results.push({
          success: false,
          message: 'Migration failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      total: emails.length,
      successful,
      failed,
      results
    };
  }
}

export default MigrationService;
