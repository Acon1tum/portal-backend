import { Router, Request, Response } from 'express'
import { PrismaClient, MessageStatus } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'
import { broadcastNewMessage } from '../utils/websocket'

const router = Router()
const prisma = new PrismaClient()

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { content, userId, senderId, hasAttachments } = req.body

    if (!content || !userId || !senderId) {
      return res.status(400).json({ error: 'content, userId, and senderId are required' })
    }

    const message = await prisma.message.create({
      data: {
        content,
        userId,
        senderId,
        hasAttachments: !!hasAttachments,
        status: MessageStatus.PENDING
      }
    })

    // Broadcast the new message to all users in the business room
    // Assuming userId is the businessId for this example
    // You might need to adjust this based on your data structure
    try {
      broadcastNewMessage(userId, message)
    } catch (error) {
      console.error('Failed to broadcast message:', error)
    }

    res.status(201).json(message)
  })
)

export default router
