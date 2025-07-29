# API Testing Guide for Maritime Portal

## Base URL
```
http://localhost:3200
```

## Authentication Endpoints

### 1. Login
**POST** `/auth/login`
```json
{
  "email": "superadmin@maritime.com",
  "password": "test123"
}
```

### 2. Check Session
**GET** `/auth/check-session`

### 3. Logout
**POST** `/auth/logout`

## Business/Organization Endpoints

### 1. Get All Businesses
**GET** `/businesses`
```bash
curl -X GET http://localhost:3200/businesses
```

### 2. Get Business by ID
**GET** `/businesses/{id}`
```bash
curl -X GET http://localhost:3200/businesses/{business-id}
```

### 3. Create Business
**POST** `/businesses/create`
```json
{
  "name": "Maritime Solutions Ltd",
  "domain": "maritimesolutions.com",
  "logo": "https://example.com/logo.png",
  "industry": "Maritime Services",
  "description": "Leading maritime solutions provider",
  "location": "Singapore",
  "phoneNumber": "+65 6789 0123",
  "email": "contact@maritimesolutions.com",
  "websiteUrl": "https://maritimesolutions.com",
  "userId": "user-id-here"
}
```

### 4. Update Business
**PUT** `/businesses/update`
```json
{
  "id": "business-id-here",
  "name": "Updated Maritime Solutions Ltd",
  "description": "Updated description"
}
```

### 5. Delete Business
**DELETE** `/businesses/delete`
```json
{
  "id": "business-id-here"
}
```

### 6. Update Business Verification Status
**PUT** `/businesses/verify`
```json
{
  "id": "business-id-here",
  "verificationStatus": "VERIFIED"
}
```

## User Endpoints

### 1. Get All Users
**GET** `/users`

### 2. Create User
**POST** `/users/create`
```json
{
  "email": "newuser@example.com",
  "name": "John Doe",
  "sex": "MALE",
  "role": "JOBSEEKER",
  "userType": "SEAFARER",
  "currentJobStatus": "ACTIVELY_LOOKING",
  "account": {
    "email": "newuser@example.com",
    "password": "password123"
  }
}
```

### 3. Get User Profile
**GET** `/user/profile/{id}`

## Role Endpoints

### 1. Get Available Roles
**GET** `/roles`

### 2. Create Role (Info Only)
**POST** `/roles/createRole`

### 3. Edit Role (Info Only)
**PUT** `/roles/editRole/{id}`

## Tagline Category Endpoints

### 1. Get All Taglines
**GET** `/taglines`

### 2. Create Tagline
**POST** `/taglines/create`
```json
{
  "name": "Maritime Technology"
}
```

### 3. Update Tagline
**PUT** `/taglines/update`
```json
{
  "id": "tagline-id-here",
  "name": "Updated Maritime Technology"
}
```

### 4. Delete Tagline
**DELETE** `/taglines/delete`
```json
{
  "id": "tagline-id-here"
}
```

## Message Endpoints

### 1. Get All Messages
**GET** `/messages`

### 2. Create Message
**POST** `/messages/create`
```json
{
  "content": "Hello, this is a test message",
  "userId": "recipient-user-id",
  "senderId": "sender-user-id"
}
```

### 3. Update Message
**PUT** `/messages/update`
```json
{
  "id": "message-id-here",
  "content": "Updated message content"
}
```

### 4. Delete Message
**DELETE** `/messages/delete`
```json
{
  "id": "message-id-here"
}
```

### 5. Update Message Status
**PUT** `/messages/status`
```json
{
  "id": "message-id-here",
  "status": "READ"
}
```

## Testing with cURL

### Example: Create a Business
```bash
curl -X POST http://localhost:3200/businesses/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ocean Freight Solutions",
    "domain": "oceanfreight.com",
    "logo": "https://example.com/oceanfreight-logo.png",
    "industry": "Maritime Logistics",
    "description": "Comprehensive maritime logistics services",
    "location": "Rotterdam, Netherlands",
    "phoneNumber": "+31 10 123 4567",
    "email": "info@oceanfreight.com",
    "websiteUrl": "https://oceanfreight.com",
    "userId": "user-id-here"
  }'
```

### Example: Get All Businesses
```bash
curl -X GET http://localhost:3200/businesses
```

### Example: Login
```bash
curl -X POST http://localhost:3200/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@maritime.com",
    "password": "test123"
  }'
```

## Testing with Postman

### 1. Import Collection
Create a new collection in Postman and add the following requests:

### 2. Environment Variables
Set up environment variables:
- `baseUrl`: `http://localhost:3200`
- `sessionId`: (will be set after login)

### 3. Pre-request Script for Login
```javascript
// Set this in the login request
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.environment.set("sessionId", jsonData.user.id);
});
```

## Testing with JavaScript/Fetch

### Example: Create Business
```javascript
const createBusiness = async () => {
  const response = await fetch('http://localhost:3200/businesses/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: "Maritime Solutions Ltd",
      domain: "maritimesolutions.com",
      logo: "https://example.com/logo.png",
      industry: "Maritime Services",
      description: "Leading maritime solutions provider",
      location: "Singapore",
      phoneNumber: "+65 6789 0123",
      email: "contact@maritimesolutions.com",
      websiteUrl: "https://maritimesolutions.com",
      userId: "user-id-here"
    })
  });
  
  const data = await response.json();
  console.log(data);
};
```

## Testing with Thunder Client (VS Code Extension)

1. Install Thunder Client extension in VS Code
2. Create a new collection
3. Add requests using the same endpoints and data as above
4. Use the built-in environment variables feature

## Common Test Scenarios

### 1. Business CRUD Operations
1. Create a new business
2. Get all businesses (verify the new one is there)
3. Get the specific business by ID
4. Update the business
5. Verify the update
6. Delete the business
7. Verify deletion

### 2. User Management
1. Create a new user
2. Login with the new user
3. Check session
4. Logout

### 3. Role Testing
1. Get available roles
2. Create a user with different roles
3. Verify role assignments

### 4. Error Handling
1. Try to create business with missing fields
2. Try to access non-existent resources
3. Try to update with invalid data

## Expected Responses

### Successful Business Creation
```json
{
  "id": "uuid-here",
  "name": "Maritime Solutions Ltd",
  "domain": "maritimesolutions.com",
  "logo": "https://example.com/logo.png",
  "industry": "Maritime Services",
  "description": "Leading maritime solutions provider",
  "location": "Singapore",
  "phoneNumber": "+65 6789 0123",
  "email": "contact@maritimesolutions.com",
  "websiteUrl": "https://maritimesolutions.com",
  "verificationStatus": "PENDING",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "userId": "user-id-here"
}
```

### Error Response
```json
{
  "error": "Missing required field(s)",
  "missing": ["name", "email"]
}
```

## Notes
- All endpoints return JSON responses
- Use proper HTTP status codes (200, 201, 400, 404, 500)
- Session management is handled automatically by express-session
- UUIDs are used for IDs
- Timestamps are in ISO format 