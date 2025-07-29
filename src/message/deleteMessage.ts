import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'
import { broadcastToUsers } from '../utils/websocket'

const router = Router()
const prisma = new PrismaClient()

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    // Get the message before deleting to get sender and receiver IDs
    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await prisma.message.delete({
      where: { id: req.params.id }
    });

    // Broadcast the deletion to both sender and receiver
    try {
      broadcastToUsers([message.senderId, message.userId], 'message-deleted', {
        messageId: req.params.id,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to broadcast message deletion:', error);
    }

    res.status(204).send()
  })
)

export default router
