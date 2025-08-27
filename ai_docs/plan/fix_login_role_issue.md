### Plan to Fix Login Role Issue

1.  **Update `src/services/migrationService.ts`:**
    *   I will modify the `migrateUserFromSupabase` function to correctly map the `userRole` and `userType` from Supabase to the corresponding enums in the Prisma schema.

2.  **Create Mapping Functions:**
    *   I will create two helper functions:
        *   `mapSupabaseRoleToPrismaRole(supabaseRole: string): UserRole`: This function will take the `userRole` string from Supabase and return the corresponding `UserRole` enum value.
        *   `mapSupabaseTypeToPrismaType(supabaseType: string): UserType`: This function will take the `userType` string from Supabase and return the corresponding `UserType` enum value.

3.  **Implement the Mapping Logic:**
    *   The `mapSupabaseRoleToPrismaRole` function will implement the following mapping:
        *   'Job Seeker' -> `JOBSEEKER`
        *   'Manning Agency' -> `MANNING_AGENCY`
        *   'SUPERADMIN' -> `SUPERADMIN`
        *   'EXHIBITOR' -> `EXHIBITOR`
        *   'SPONSOR' -> `SPONSOR`
        *   Any other value will be mapped to `VISITOR`.
    *   The `mapSupabaseTypeToPrismaType` function will implement a similar mapping for `userType`.

4.  **Update User Creation Logic:**
    *   In the `migrateUserFromSupabase` function, I will use these mapping functions to set the `role` and `userType` of the new user.
    *   This will ensure that the user created in the local database has the same `role` and `userType` as in Supabase, and the `isEligibleForMigration` check will work as expected.
