import dotenv from 'dotenv';

dotenv.config();

export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Table names in Supabase
  tables: {
    userAccount: 'UserAccount',
    userDetails: 'UserDetails'
  },
  
  // Default settings
  defaults: {
    userRole: 'VISITOR',
    userType: 'OTHERS',
    currentJobStatus: 'NOT_LOOKING',
    sex: 'MALE',
    isEmailVerified: true
  }
};

// Validation function
export const validateSupabaseConfig = (): boolean => {
  if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
    console.error('Missing required Supabase configuration:');
    console.error('- SUPABASE_URL:', !!supabaseConfig.url);
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseConfig.serviceRoleKey);
    return false;
  }
  return true;
};

// Get configuration for specific environment
export const getSupabaseConfig = (environment: 'development' | 'production' = 'development') => {
  if (environment === 'production' && !supabaseConfig.serviceRoleKey) {
    throw new Error('Service role key is required for production environment');
  }
  
  return {
    ...supabaseConfig,
    environment
  };
};
