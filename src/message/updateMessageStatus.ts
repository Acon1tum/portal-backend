import { Router, Request, Response } from 'express'
import { PrismaClient, MessageStatus } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body

    // Validate enum value
    if (!Object.values(MessageStatus).includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${Object.values(MessageStatus).join(', ')}`
      })
    }

    try {
      const updated = await prisma.message.update({
        where: { id: req.params.id },
        data: { status }
      })

      res.json(updated)
    } catch (error) {
      console.error('Error updating message status:', error)
      res.status(500).json({ error: 'Failed to update message status' })
    }
  })
)

export default router
