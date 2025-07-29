import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, businessId } = req.body

    if (!name || !businessId) {
      return res.status(400).json({ error: 'Both name and businessId are required' })
    }

    // Check if business exists
    const business = await prisma.organization.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    try {
      const newTagline = await prisma.taglineCategory.create({
        data: {
          name,
          organizations: {
            connect: { id: businessId }
          }
        },
        include: {
          organizations: true
        }
      })

      res.status(201).json(newTagline)
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as any).code === 'P2002'
      ) {
        return res.status(409).json({ error: 'Tagline name must be unique' })
      }

      throw error
    }
  })
)

export default router
