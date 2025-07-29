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

export default router
