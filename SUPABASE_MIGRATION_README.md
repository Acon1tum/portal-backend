# Supabase Migration System

This document describes the integration of your current system with an external Supabase database for user authentication and automatic migration.

## Overview

The system now supports dual authentication:
1. **Local Authentication**: Users already in your local database
2. **Supabase Authentication**: Users from the external Supabase system with automatic migration

## Features

- **Seamless Login**: Users can login with their Supabase credentials
- **Auto-Migration**: User data is automatically migrated from Supabase on first login
- **Admin Controls**: Admin endpoints for managing migrations
- **Migration Tracking**: Complete audit trail of migrated users

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL="your-supabase-project-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### Required Supabase Tables

The system expects these tables in your Supabase database:

#### UserAccount Table
```sql
CREATE TABLE "UserAccount" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### UserDetails Table
```sql
CREATE TABLE "UserDetails" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "UserAccount"(id),
  "first_name" TEXT,
  "last_name" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "country" TEXT,
  "postal_code" TEXT,
  "date_of_birth" DATE,
  "profile_picture" TEXT,
  "bio" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## How It Works

### 1. Login Process

When a user attempts to login:

1. **Check Local Database**: First, check if user exists locally
2. **Local Authentication**: If found, authenticate with local credentials
3. **Supabase Authentication**: If not found locally, try Supabase authentication
4. **Auto-Migration**: If Supabase auth succeeds, automatically migrate user data
5. **Session Creation**: Create session and return user data

### 2. Migration Process

During migration:

1. **User Creation**: Create user record in local database
2. **Account Creation**: Create account with hashed password
3. **Profile Data**: Migrate available profile information
4. **Tracking**: Mark user as migrated with timestamp and Supabase ID

### 3. Migration Tracking

Each migrated user gets:
- `migratedFromSupabase: true`
- `supabaseUserId`: Original Supabase user ID
- `migrationDate`: When migration occurred

## API Endpoints

### Authentication

#### POST `/auth/login`
Standard login endpoint that now supports both local and Supabase authentication.

**Response for migrated users:**
```json
{
  "user": { /* user data */ },
  "isLocalUser": false,
  "message": "Login successful",
  "migrationInfo": {
    "migrated": true,
    "message": "User successfully migrated from Supabase",
    "supabaseUserId": "uuid-from-supabase"
  }
}
```

### Admin Migration Endpoints

All migration endpoints require SUPERADMIN role.

#### GET `/auth/migration/status/:email`
Check migration status for a specific user.

#### GET `/auth/migration/needs-migration/:email`
Check if a user needs migration.

#### POST `/auth/migration/migrate-user`
Manually migrate a specific user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "user-password"
}
```

#### POST `/auth/migration/bulk-migrate`
Migrate multiple users at once.

**Body:**
```json
{
  "emails": ["user1@example.com", "user2@example.com"]
}
```

#### GET `/auth/migration/migrated-users`
Get list of all migrated users.

#### GET `/auth/migration/test-connection`
Test Supabase connection.

## Database Schema Changes

The `User` model now includes:

```prisma
model User {
  // ... existing fields ...
  
  // Migration tracking fields
  migratedFromSupabase Boolean      @default(false)
  supabaseUserId       String?      // Store the original Supabase user ID
  migrationDate        DateTime?    // When the migration happened
  
  // ... existing relationships ...
}
```

## Security Considerations

1. **Service Role Key**: The system uses Supabase service role key for admin access
2. **Password Hashing**: Passwords are re-hashed during migration
3. **Admin Access**: Migration endpoints require SUPERADMIN role
4. **Rate Limiting**: Bulk operations are limited to 100 users per request

## Error Handling

The system handles various error scenarios:

- **Invalid Credentials**: Returns 401 for authentication failures
- **Migration Failures**: Returns 500 with detailed error information
- **Duplicate Users**: Prevents migration of existing users
- **Connection Issues**: Graceful fallback for Supabase connection problems

## Monitoring and Logging

All migration operations are logged with:
- Timestamp
- User email
- Operation type
- Success/failure status
- Error details (if applicable)

## Testing

### Test Supabase Connection
```bash
GET /auth/migration/test-connection
```

### Test Migration Status
```bash
GET /auth/migration/status/user@example.com
```

### Test Manual Migration
```bash
POST /auth/migration/migrate-user
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all Supabase environment variables are set
   - Check `.env` file configuration

2. **Supabase Connection Failures**
   - Verify Supabase URL and API keys
   - Check network connectivity
   - Ensure service role key has proper permissions

3. **Migration Failures**
   - Check database connection
   - Verify table schemas match expectations
   - Review error logs for specific issues

4. **Authentication Issues**
   - Verify password hashing in Supabase
   - Check table structure matches expected format
   - Ensure proper error handling

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL="debug"
```

## Future Enhancements

1. **Incremental Sync**: Periodic sync of updated user data
2. **Bidirectional Sync**: Sync changes back to Supabase
3. **Data Validation**: Enhanced validation of migrated data
4. **Rollback Support**: Ability to revert migrations
5. **Batch Processing**: Improved bulk migration performance

## Support

For issues or questions:
1. Check the logs for error details
2. Verify Supabase configuration
3. Test individual endpoints
4. Review database schema compatibility
