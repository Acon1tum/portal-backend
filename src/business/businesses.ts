import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler' 

const router = Router()
const prisma = new PrismaClient()

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const businesses = await prisma.organization.findMany({
      include: {
        user: true,
        taglineCategories: true
      }
    })

    res.json(businesses)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const business = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        taglineCategories: true
      }
    })

    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }

    res.json(business)
  })
)

export default router
