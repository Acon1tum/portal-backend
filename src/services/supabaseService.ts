import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

// Create Supabase client with service role key for admin access
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test Supabase connection on startup
console.log('🔌 Initializing Supabase connection...');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Service Role Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NOT SET');

// Test the connection immediately
(async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('UserAccounts')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
      console.error('🔍 Error details:', error);
    } else {
      console.log('✅ Successfully connected to Supabase database');
      console.log('📊 Connection test result:', data);
    }
  } catch (err: any) {
    console.error('❌ Supabase connection error:', err?.message || err);
  }
})();

// Types for Supabase tables (matching your actual schema)
export interface SupabaseUserAccount {
  id: string;
  email: string;
  password: string;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  student?: any;
  seafarer?: any;
  corporate_professional?: any;
  others?: any;
  consent: boolean;
  status: string;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
}

export interface SupabaseUserDetails {
  id: string;
  user_id: string;
  name: {
    first: string;
    last: string;
  };
  userType: string;
  userRole: string;
  address: {
    street: string | null;
    city: string | null;
  };
  phone: string;
  sex: string;
  bday: Date;
  profileImage: string;
  created_at?: string;
  updated_at?: string;
}

// Service class for Supabase operations
export class SupabaseService {
  /**
   * Authenticate user with email and password from Supabase
   */
  static async authenticateUser(email: string, password: string): Promise<{
    success: boolean;
    user?: SupabaseUserAccount;
    userDetails?: SupabaseUserDetails;
    error?: string;
  }> {
    try {
      console.log(`🔍 Attempting Supabase authentication for email: ${email}`);
      
      // Query the UserAccounts table directly (matching your actual Supabase schema)
      const { data: userAccount, error: userError } = await supabase
        .from('UserAccounts')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userAccount) {
        console.log(`❌ User not found in Supabase:`, userError);
        return {
          success: false,
          error: 'User not found in Supabase'
        };
      }

      console.log(`✅ User found in Supabase: ${userAccount.email}`);
      
      const userPassword = userAccount.password;
      console.log(`🔐 Password format in Supabase: ${userPassword.substring(0, 20)}...`);

      // Verify password - handle different password storage scenarios
      let passwordValid = false;
      
      console.log(`🔐 Attempting password validation...`);
      
      // Check if password is stored as plain text (direct comparison)
      if (userPassword === password) {
        console.log(`✅ Password matches (plain text)`);
        passwordValid = true;
      }
      // Check if password is stored as bcrypt hash
      else if (userPassword.startsWith('$2a$') || userPassword.startsWith('$2b$') || userPassword.startsWith('$2y$')) {
        console.log(`🔐 Attempting bcrypt comparison...`);
        try {
          const bcrypt = require('bcryptjs');
          passwordValid = await bcrypt.compare(password, userPassword);
          console.log(`🔐 Bcrypt comparison result: ${passwordValid}`);
        } catch (bcryptError) {
          console.error('❌ Bcrypt comparison error:', bcryptError);
        }
      }
      // Check if password is stored as MD5 hash (common in some systems)
      else if (userPassword.length === 32) {
        console.log(`🔐 Attempting MD5 comparison...`);
        const crypto = require('crypto');
        const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
        passwordValid = (hashedPassword === userPassword);
        console.log(`🔐 MD5 comparison result: ${passwordValid}`);
      }
      else {
        console.log(`❓ Unknown password format. Length: ${userPassword.length}`);
      }
      
      if (!passwordValid) {
        console.log(`❌ Password validation failed. Supabase password format: ${userPassword.substring(0, 20)}...`);
        return {
          success: false,
          error: 'Invalid password'
        };
      }
      
      console.log(`✅ Password validation successful!`);

      // Get user details from UserDetails table
      let userDetails: SupabaseUserDetails | undefined;
      try {
        const { data: detailsData, error: detailsError } = await supabase
          .from('UserDetails')
          .select('*')
          .eq('id', userAccount.id)
          .single();

        if (!detailsError && detailsData) {
          userDetails = {
            id: detailsData.id,
            user_id: detailsData.id,
            name: detailsData.name,
            userType: detailsData.userType,
            userRole: detailsData.userRole,
            address: detailsData.address,
            phone: detailsData.phone,
            sex: detailsData.sex,
            bday: detailsData.bday,
            profileImage: detailsData.profileImage
          };
        }
      } catch (detailsError) {
        console.log('⚠️ Could not fetch user details:', detailsError);
      }

      return {
        success: true,
        user: {
          id: userAccount.id,
          email: userAccount.email,
          password: userPassword,
          qrCode: userAccount.qrCode,
          createdAt: userAccount.createdAt,
          updatedAt: userAccount.updatedAt,
          student: userAccount.student,
          seafarer: userAccount.seafarer,
          corporate_professional: userAccount.corporate_professional,
          others: userAccount.others,
          consent: userAccount.consent,
          status: userAccount.status,
          resetToken: userAccount.resetToken,
          resetTokenExpiry: userAccount.resetTokenExpiry
        },
        userDetails
      };
    } catch (error) {
      console.error('Supabase authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Get user details by user ID
   */
  static async getUserDetails(userId: string): Promise<SupabaseUserDetails | null> {
    try {
      const { data, error } = await supabase
        .from('UserDetails')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user details:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserDetails:', error);
      return null;
    }
  }

  /**
   * Check if user exists in Supabase
   */
  static async userExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('UserAccounts')
        .select('id')
        .eq('email', email)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }
}

export default SupabaseService;
