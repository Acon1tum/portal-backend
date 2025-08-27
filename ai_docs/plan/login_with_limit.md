### Plan to Implement Login with User Creation Limit

1.  **Define User Limit:**
    *   I will add a new environment variable `MAX_USERS` to the `.env` file to define the maximum number of users allowed in the system.
    *   I will set a default value for `MAX_USERS` (e.g., 100) if it's not defined in the `.env` file.

2.  **Modify Login Logic in `src/auth/login.ts`:**
    *   In the login route handler, after checking for the user in the local database and Supabase, if the user is not found, I will add a new section to handle the creation of a new user.

3.  **Implement User Creation with Limit:**
    *   Before creating a new user, I will query the database to get the current number of users.
    *   I will compare the current number of users with the `MAX_USERS` limit.
    *   If the user count is below the limit, I will proceed with creating a new user.
    *   If the user count has reached the limit, I will return a `403 Forbidden` error with a message indicating that the user limit has been reached.

4.  **Create a New User and Account:**
    *   I will create a new function, `createUserAndAccount`, that will be responsible for creating a new `User` and a new `Account` in the database.
    *   This function will take the user's email and password as input.
    *   It will hash the password using `bcrypt` before storing it in the `Account` table.
    *   It will create a new `User` with default values for `role`, `userType`, etc.
    *   The new user will not be marked as migrated from Supabase.

5.  **Log in the New User:**
    *   After successfully creating the new user and account, I will create a session for the user, similar to the existing login logic.
    *   I will return a success response with the user's information.

6.  **Refactor `login.ts` for Clarity:**
    *   I will refactor the `login.ts` file to improve readability and maintainability by extracting the user creation logic into a separate function.
