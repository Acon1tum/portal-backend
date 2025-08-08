import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const messages = await prisma.message.findMany({
      include: {
        user: true,
        sender: true
      }
    })

    res.json(messages)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        sender: true
      }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    res.json(message)
  })
)

// Get chat contacts for a user (users they have conversations with)
router.get(
  '/contacts/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params

    // Get all messages where the user is either sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { userId: userId }
        ]
      },
      include: {
        user: true,
        sender: true
      }
    })

    // Extract unique contacts
    const contactIds = new Set<string>()
    const contacts: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      userType?: string;
    }> = []

    messages.forEach(message => {
      // Add the other user in the conversation (not the current user)
      const otherUserId = message.senderId === userId ? message.userId : message.senderId
      if (otherUserId !== userId && !contactIds.has(otherUserId)) {
        contactIds.add(otherUserId)
        
        // Get user details from the message
        const otherUser = message.senderId === userId ? message.user : message.sender
        if (otherUser) {
          contacts.push({
            id: otherUser.id,
            name: otherUser.name || 'Unknown User',
            email: otherUser.email,
            role: 'USER', // Default role, you might want to get this from user data
            userType: 'SEAFARER' // Default userType, you might want to get this from user data
          })
        }
      }
    })

    res.json(contacts)
  })
)

// Search users for new chat conversations
router.get(
  '/search-users/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { q } = req.query // search query

    // Get all users except the current user
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          q ? {
            OR: [
              { name: { contains: q as string, mode: 'insensitive' } },
              { email: { contains: q as string, mode: 'insensitive' } }
            ]
          } : {}
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userType: true
      }
    })

    // Transform to match frontend expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email,
      role: user.role,
      userType: user.userType
    }))

    res.json(transformedUsers)
  })
)

export default router
