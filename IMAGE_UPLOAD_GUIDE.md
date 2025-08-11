# Image Upload Guide

## Overview
This guide explains how to use the new profile picture and cover photo upload functionality.

## Features
- Profile picture upload for users
- Cover photo upload for users and organizations
- Base64 image processing
- File validation (image types only, max 5MB)
- Automatic file storage in `/uploads` directory

## API Endpoints

### Upload Image
- **POST** `/api/upload/image`
- **Body**: 
  ```json
  {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "type": "profile" | "cover"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "url": "http://localhost:3001/uploads/filename.jpg",
    "filename": "filename.jpg",
    "size": 12345,
    "type": "profile"
  }
  ```

### Update User Profile
- **PATCH** `/users/:id`
- **Body**:
  ```json
  {
    "profilePicture": "http://localhost:3001/uploads/profile.jpg",
    "coverPhoto": "http://localhost:3001/uploads/cover.jpg"
  }
  ```

### Update Organization Profile
- **PATCH** `/businesses/:id`
- **Body**:
  ```json
  {
    "profilePicture": "http://localhost:3001/uploads/org-profile.jpg",
    "coverPhoto": "http://localhost:3001/uploads/org-cover.jpg"
  }
  ```

## Frontend Components

### ProfileImageEditor
A reusable component that provides edit buttons for profile picture and cover photo.

```tsx
<ProfileImageEditor
  profilePicture={user.profilePicture}
  coverPhoto={user.coverPhoto}
  onUpdate={handleImageUpdate}
  isOrganization={false}
  organizationId={orgId} // if isOrganization is true
/>
```

### ImageUploadModal
A modal component for uploading images with preview functionality.

```tsx
<ImageUploadModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={(url) => handleSuccess(url)}
  type="profile" // or "cover"
  currentImage={currentImageUrl}
  title="Update Profile Picture"
  description="Upload a new profile picture"
  aspectRatio="square" // or "wide"
/>
```

## Database Schema Updates

The following fields have been added to the User and Organization models:

```prisma
model User {
  // ... existing fields
  profilePicture   String?          // URL to profile picture
  coverPhoto       String?          // URL to cover photo
}

model Organization {
  // ... existing fields
  profilePicture   String?          // URL to profile picture
  coverPhoto       String?          // URL to cover photo
}
```

## Setup Instructions

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install uuid @types/uuid
   ```

2. **Run Database Migration**:
   ```bash
   npx prisma migrate dev --name add_profile_and_cover_photos
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Create Uploads Directory**:
   The uploads directory will be created automatically when the first image is uploaded.

## File Storage
- Images are stored in the `portal-backend/uploads/` directory
- Files are named with unique IDs to prevent conflicts
- Original file extensions are preserved
- Maximum file size: 20MB
- Supported formats: JPEG, PNG, GIF, WebP

## Security Considerations
- Only image files are accepted
- File size is limited to 20MB
- Files are stored with unique names to prevent path traversal attacks
- Consider implementing authentication middleware for upload endpoints in production

## Usage Example

```typescript
import { ImageUploadService } from '@/service/imageUploadService';

// Upload an image
const result = await ImageUploadService.uploadImage(file, 'profile');
if (result.success) {
  // Update user profile with new image URL
  await ImageUploadService.updateUserProfile(userId, {
    profilePicture: result.url
  });
}
```
