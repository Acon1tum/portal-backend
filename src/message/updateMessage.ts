import { Router, Request, Response } from 'express'
import { PrismaClient, MessageStatus } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { content, status, hasAttachments } = req.body

    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: {
        content,
        status: status as MessageStatus,
        hasAttachments
      }
    })

    res.json(message)
  })
)

export default router
