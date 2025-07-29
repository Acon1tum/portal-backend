import { Router, Request, Response } from 'express'
import { PrismaClient, VerificationStatus } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { verificationStatus } = req.body

    // Check if value is a valid enum
    if (!Object.values(VerificationStatus).includes(verificationStatus)) {
      return res.status(400).json({
        error: `Invalid verificationStatus. Must be one of: ${Object.values(VerificationStatus).join(', ')}`
      })
    }

    try {
      const updated = await prisma.organization.update({
        where: { id: req.params.id },
        data: { verificationStatus }
      })

      res.json(updated)
    } catch (error) {
      console.error('Error updating verification status:', error)
      res.status(500).json({ error: 'Failed to update verification status' })
    }
  })
)

export default router
