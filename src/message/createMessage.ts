import { Router, Request, Response } from 'express'
import { PrismaClient, MessageStatus } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'
import { broadcastUserMessage } from '../utils/websocket'

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

    // Broadcast the new message to both sender and receiver
    try {
      broadcastUserMessage(senderId, userId, message)
    } catch (error) {
      console.error('Failed to broadcast message:', error)
    }

    res.status(201).json(message)
  })
)

export default router
