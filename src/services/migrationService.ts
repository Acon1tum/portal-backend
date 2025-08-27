import { PrismaClient, UserRole, UserType } from '@prisma/client';
import { SupabaseService, SupabaseUserAccount, SupabaseUserDetails } from './supabaseService';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface MigrationResult {
  success: boolean;
  user?: any;
  message: string;
  error?: string;
}

// Helper function to map Supabase role to Prisma role
const mapSupabaseRoleToPrismaRole = (supabaseRole?: string): UserRole => {
  switch (supabaseRole) {
    case 'Job Seeker':
      return UserRole.JOBSEEKER;
    case 'Manning Agency':
      return UserRole.MANNING_AGENCY;
    case 'SUPERADMIN':
      return UserRole.SUPERADMIN;
    case 'EXHIBITOR':
      return UserRole.EXHIBITOR;
    case 'SPONSOR':
      return UserRole.SPONSOR;
    default:
      return UserRole.VISITOR;
  }
};

// Helper function to map Supabase type to Prisma type
const mapSupabaseTypeToPrismaType = (supabaseType?: string): UserType => {
  switch (supabaseType) {
    case 'SEAFARER':
      return UserType.SEAFARER;
    case 'CORPORATE_PROFESSIONAL':
      return UserType.CORPORATE_PROFESSIONAL;
    case 'STUDENTS':
      return UserType.STUDENTS;
    case 'SUPERADMIN':
      return UserType.SUPERADMIN;
    default:
      return UserType.OTHERS;
  }
};

export class MigrationService {
  /**
   * Check if user is eligible for migration based on userType and userRole
   */
  private static isEligibleForMigration(userDetails?: SupabaseUserDetails): boolean {
    if (!userDetails) {
      return false;
    }

    const { userType, userRole } = userDetails;

    if (!userType) {
      return false;
    }

    switch (userType) {
      case 'CORPORATE_PROFESSIONAL':
        // CORPORATE_PROFESSIONAL can have any userRole
        return true;

      case 'SEAFARER':
        // SEAFARER only allowed if userRole is "Job Seeker"
        return userRole === 'Job Seeker';

      case 'STUDENTS':
        // STUDENTS only allowed if userRole is "Job Seeker"
        return userRole === 'Job Seeker';

      case 'OTHERS':
        // OTHERS only allowed if userRole is "Manning Agency" or "Job Seeker"
        return userRole === 'Manning Agency' || userRole === 'Job Seeker';

      default:
        return false;
    }
  }

  /**
   * Migrate user from Supabase to local database
   */
  static async migrateUserFromSupabase(
    supabaseUser: SupabaseUserAccount,
    supabaseUserDetails?: SupabaseUserDetails
  ): Promise<MigrationResult> {
    try {
      // Validate user eligibility for migration
      if (!this.isEligibleForMigration(supabaseUserDetails)) {
        const userType = supabaseUserDetails?.userType || 'unknown';
        const userRole = supabaseUserDetails?.userRole || 'unknown';
        
        return {
          success: false,
          message: `Migration denied: UserType ''''${userType}'''' with UserRole ''''${userRole}'''' is not allowed. Valid combinations: CORPORATE_PROFESSIONAL (any role), SEAFARER (Job Seeker only), STUDENTS (Job Seeker only), OTHERS (Manning Agency or Job Seeker only).`,
          error: 'INVALID_USER_CREDENTIALS'
        };
      }

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
            role: mapSupabaseRoleToPrismaRole(supabaseUserDetails?.userRole),
            userType: mapSupabaseTypeToPrismaType(supabaseUserDetails?.userType),
            currentJobStatus: 'NOT_LOOKING', // Default status
            isEmailVerified: true, // Assume verified if coming from Supabase
            migratedFromSupabase: true,
            supabaseUserId: supabaseUser.id,
            migrationDate: new Date(),
          }
        });

        // Create account with password - handle different password formats from Supabase
        let finalPassword: string;
        
        // Check if the password from Supabase is already hashed
        if (supabaseUser.password.startsWith('$2a$') || 
            supabaseUser.password.startsWith('$2b$') || 
            supabaseUser.password.startsWith('$2y$')) {
          // Password is already bcrypt hashed, store as-is
          finalPassword = supabaseUser.password;
          console.log('Password from Supabase is already hashed, storing as-is');
        } else {
          // Password is plain text, hash it before storing
          finalPassword = await bcrypt.hash(supabaseUser.password, 12);
          console.log('Password from Supabase is plain text, hashing before storage');
        }
        
        await tx.account.create({
          data: {
            email: supabaseUser.email,
            password: finalPassword,
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
   * Check if user needs migration (only for allowed userTypes)
   */
  static async needsMigration(email: string): Promise<boolean> {
    try {
      // Check if user exists in local database
      const localUser = await prisma.user.findUnique({
        where: { email }
      });

      // If user doesn't exist locally but exists in Supabase, check if they're eligible for migration
      if (!localUser) {
        const existsInSupabase = await SupabaseService.userExists(email);
        
        if (existsInSupabase) {
          // Check user eligibility for migration
          const userDetails = await SupabaseService.getUserDetailsByEmail(email);
          
          if (this.isEligibleForMigration(userDetails || undefined)) {
            return true;
          }
        }
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