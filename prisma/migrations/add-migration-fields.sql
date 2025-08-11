-- Migration: Add Supabase migration tracking fields to User table
-- Date: 2024-01-XX
-- Description: Adds fields to track users migrated from Supabase

-- Add new columns to User table
ALTER TABLE "User" 
ADD COLUMN "migratedFromSupabase" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN "supabaseUserId" TEXT,
ADD COLUMN "migrationDate" TIMESTAMP WITH TIME ZONE;

-- Create index on supabaseUserId for faster lookups
CREATE INDEX "idx_user_supabase_user_id" ON "User"("supabaseUserId");

-- Create index on migratedFromSupabase for filtering migrated users
CREATE INDEX "idx_user_migrated_from_supabase" ON "User"("migratedFromSupabase");

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN "User"."migratedFromSupabase" IS 'Indicates if user was migrated from Supabase';
COMMENT ON COLUMN "User"."supabaseUserId" IS 'Original user ID from Supabase system';
COMMENT ON COLUMN "User"."migrationDate" IS 'Timestamp when user was migrated from Supabase';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('migratedFromSupabase', 'supabaseUserId', 'migrationDate')
ORDER BY column_name;
