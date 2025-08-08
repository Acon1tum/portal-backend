import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();
const prisma = new PrismaClient();
const prismaAny = prisma as any;

// Test endpoint to check user session and organization
router.get('/test/user', asyncHandler(async (req, res) => {
  const userId = (req.session as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'No user in session' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      organization: true,
      organizations: true 
    },
  });

  res.json({
    sessionUser: (req.session as any).user,
    dbUser: user,
    hasOrganization: !!user?.organization,
    hasOrganizations: (user?.organizations?.length || 0) > 0,
    orgCount: user?.organizations?.length || 0
  });
}));

// Test endpoint to create posting with hardcoded organization
router.post('/test/create', asyncHandler(async (req, res) => {
  const { title, content, postType, isPublished = false } = req.body;
  const userId = (req.session as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Create a test organization if it doesn't exist
  let testOrg = await prisma.organization.findFirst({
    where: { name: 'Test Organization' }
  });

  if (!testOrg) {
    testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        email: 'test@example.com',
        verificationStatus: 'UNVERIFIED',
      },
    });
  }

  const posting = await prisma.posting.create({
    data: {
      title,
      content,
      postType,
      isPublished,
      organizationId: testOrg.id,
      createdById: userId,
    },
    include: {
      organization: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      attachments: true,
    },
  });

  res.status(201).json(posting);
}));

// Get all postings
router.get('/', asyncHandler(async (req, res) => {
  const postings = await prisma.posting.findMany({
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      attachments: true,
      _count: { select: { comments: true } }
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(postings);
}));

// Get posting by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const posting = await prisma.posting.findUnique({
    where: { id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
          description: true,
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      attachments: true,
      _count: { select: { comments: true } }
    },
  });

  if (!posting) {
    return res.status(404).json({ error: 'Posting not found' });
  }

  res.json(posting);
}));

// Get postings by organization
router.get('/organization/:organizationId', asyncHandler(async (req, res) => {
  const { organizationId } = req.params;

  const postings = await prisma.posting.findMany({
    where: { organizationId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      attachments: true,
      _count: { select: { comments: true } }
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(postings);
}));

// Get postings by type
router.get('/type/:postType', asyncHandler(async (req, res) => {
  const { postType } = req.params;

  const postings = await prisma.posting.findMany({
    where: { 
      postType: postType as any,
      isPublished: true,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      attachments: true,
      _count: { select: { comments: true } }
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(postings);
}));

// Get comments for a posting
router.get('/:id/comments', asyncHandler(async (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-email');
  const { id } = req.params;
  const comments = await prismaAny.comment.findMany({
    where: { postingId: id },
    include: {
      user: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
  res.json(comments);
}));

// Create a comment for a posting
router.post('/:id/comments', asyncHandler(async (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-email');
  const { id } = req.params;
  const { content } = req.body as { content?: string };
  const userId = (req.session as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Ensure posting exists
  const posting = await prisma.posting.findUnique({ where: { id } });
  if (!posting) {
    return res.status(404).json({ error: 'Posting not found' });
  }

  const newComment = await prismaAny.comment.create({
    data: {
      content: content.trim(),
      postingId: id,
      userId,
    },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });

  res.status(201).json(newComment);
}));

// OPTIONS for comments (preflight)
router.options('/:id/comments', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-email');
  res.status(200).end();
});

// Delete a comment (by comment author, post author, or SUPERADMIN)
router.delete('/:id/comments/:commentId', asyncHandler(async (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-email');
  const { id, commentId } = req.params;
  const sessionUser = (req.session as any).user;
  const userId = sessionUser?.id;
  const role = sessionUser?.role;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const comment = await prismaAny.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment || comment.postingId !== id) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const posting = await prisma.posting.findUnique({ where: { id } });
  if (!posting) {
    return res.status(404).json({ error: 'Posting not found' });
  }

  const isCommentOwner = comment.userId === userId;
  const isPostOwner = posting.createdById === userId;
  const isSuperAdmin = role === 'SUPERADMIN';

  if (!isCommentOwner && !isPostOwner && !isSuperAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prismaAny.comment.delete({ where: { id: commentId } });
  res.json({ success: true });
}));

// OPTIONS for delete comment
router.options('/:id/comments/:commentId', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-email');
  res.status(200).end();
});

// Create new posting
router.post('/create', asyncHandler(async (req, res) => {
  const { title, content, postType, isPublished = false, attachments = [] } = req.body;
  const userId = (req.session as any).user?.id;

  console.log('Create posting request:', { title, content, postType, isPublished, userId, attachmentsCount: attachments.length });

  if (!userId) {
    console.log('No user ID found in session');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get user's organization from the session or user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      organization: true,
      organizations: true 
    },
  });

  console.log('User data:', {
    id: user?.id,
    email: user?.email,
    organization: user?.organization,
    organizations: user?.organizations
  });

  // Check for organization in both one-to-one and many-to-many relationships
  let organizationId = user?.organization?.id;
  
  // If no one-to-one organization, check many-to-many relationships
  if (!organizationId && user?.organizations && user.organizations.length > 0) {
    organizationId = user.organizations[0].id; // Use the first organization
  }

  console.log('Selected organization ID:', organizationId);

  if (!organizationId) {
    console.log('No organization found for user');
    
    // For now, let's create a default organization for the user if they don't have one
    try {
      console.log('Creating default organization for user');
      const defaultOrg = await prisma.organization.create({
        data: {
          name: `${user?.name || user?.email}'s Organization`,
          email: user?.email,
          verificationStatus: 'UNVERIFIED',
          userId: userId, // This creates the one-to-one relationship
        },
      });
      
      organizationId = defaultOrg.id;
      console.log('Created default organization:', defaultOrg.id);
    } catch (orgError) {
      console.error('Failed to create default organization:', orgError);
      return res.status(400).json({ 
        error: 'User must be associated with an organization',
        details: {
          hasOneToOneOrg: !!user?.organization,
          hasManyToManyOrgs: (user?.organizations?.length || 0) > 0,
          orgCount: user?.organizations?.length || 0,
          orgCreationError: orgError instanceof Error ? orgError.message : 'Unknown error'
        }
      });
    }
  }

  try {
    // Create the posting with attachments in a transaction
    const posting = await prisma.$transaction(async (tx) => {
      // Create the posting first
      const newPosting = await tx.posting.create({
        data: {
          title,
          content,
          postType,
          isPublished,
          organizationId: organizationId,
          createdById: userId,
        },
      });

      // Create attachments if provided
      if (attachments && attachments.length > 0) {
        const attachmentData = attachments.map((attachment: any) => ({
          url: attachment.url, // This will be the base64 data
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          size: attachment.size,
          postingId: newPosting.id,
        }));

        await tx.postingAttachment.createMany({
          data: attachmentData,
        });
      }

      // Return the posting with all related data
      return await tx.posting.findUnique({
        where: { id: newPosting.id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          attachments: true,
        },
      });
    });

    console.log('Posting created successfully:', posting?.id);
    res.status(201).json(posting);
  } catch (error) {
    console.error('Error creating posting:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create posting', details: errorMessage });
  }
}));

// Update posting
router.put('/update/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, postType, isPublished } = req.body;
  const userId = (req.session as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user owns the posting or is admin
  const existingPosting = await prisma.posting.findUnique({
    where: { id },
    include: { createdBy: true },
  });

  if (!existingPosting) {
    return res.status(404).json({ error: 'Posting not found' });
  }

  if (existingPosting.createdById !== userId && (req.session as any).user?.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const posting = await prisma.posting.update({
    where: { id },
    data: {
      title,
      content,
      postType,
      isPublished,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      attachments: true,
    },
  });

  res.json(posting);
}));

// Delete posting
router.delete('/delete/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = (req.session as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user owns the posting or is admin
  const existingPosting = await prisma.posting.findUnique({
    where: { id },
    include: { createdBy: true },
  });

  if (!existingPosting) {
    return res.status(404).json({ error: 'Posting not found' });
  }

  if (existingPosting.createdById !== userId && (req.session as any).user?.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.posting.delete({
    where: { id },
  });

  res.json({ message: 'Posting deleted successfully' });
}));

// Toggle publishing status
router.put('/toggle-publish/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = (req.session as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const existingPosting = await prisma.posting.findUnique({
    where: { id },
    include: { createdBy: true },
  });

  if (!existingPosting) {
    return res.status(404).json({ error: 'Posting not found' });
  }

  if (existingPosting.createdById !== userId && (req.session as any).user?.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const posting = await prisma.posting.update({
    where: { id },
    data: {
      isPublished: !existingPosting.isPublished,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      attachments: true,
    },
  });

  res.json(posting);
}));

// Add attachment to posting
router.post('/:id/attachments', asyncHandler(async (req, res) => {
  // Add CORS headers for this specific endpoint
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-email');
  
  const { id } = req.params;
  const { url, fileName, fileType, size } = req.body;
  const userId = (req.session as any).user?.id;

  console.log('Attachment upload request:', {
    postingId: id,
    fileName,
    fileType,
    size,
    urlLength: url?.length || 0,
    userId
  });

  if (!userId) {
    console.log('No user ID found in session');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user owns the posting or is admin
  const existingPosting = await prisma.posting.findUnique({
    where: { id },
    include: { createdBy: true },
  });

  if (!existingPosting) {
    console.log('Posting not found:', id);
    return res.status(404).json({ error: 'Posting not found' });
  }

  if (existingPosting.createdById !== userId && (req.session as any).user?.role !== 'SUPERADMIN') {
    console.log('User not authorized to modify this posting');
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
  const attachment = await prisma.postingAttachment.create({
    data: {
      url,
      fileName,
      fileType,
      size,
      postingId: id,
    },
  });

    console.log('Attachment created successfully:', attachment.id);
  res.status(201).json(attachment);
  } catch (error) {
    console.error('Error creating attachment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create attachment', details: errorMessage });
  }
}));

// Handle OPTIONS requests for attachment endpoint
router.options('/:id/attachments', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-email');
  res.status(200).end();
});

// Delete attachment from posting
router.delete('/attachments/:attachmentId', asyncHandler(async (req, res) => {
  const { attachmentId } = req.params;
  const userId = (req.session as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user owns the posting or is admin
  const attachment = await prisma.postingAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      posting: {
        include: { createdBy: true }
      }
    },
  });

  if (!attachment) {
    return res.status(404).json({ error: 'Attachment not found' });
  }

  if (attachment.posting.createdById !== userId && (req.session as any).user?.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.postingAttachment.delete({
    where: { id: attachmentId },
  });

  res.json({ message: 'Attachment deleted successfully' });
}));

export default router; 