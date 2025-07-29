import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const taglines = await prisma.taglineCategory.findMany({
      include: { organizations: true }
    })

    res.json(taglines)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const tagline = await prisma.taglineCategory.findUnique({
      where: { id: req.params.id },
      include: { organizations: true }
    })

    if (!tagline) {
      return res.status(404).json({ error: 'Tagline category not found' })
    }

    res.json(tagline)
  })
)

export default router
