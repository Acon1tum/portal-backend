import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      await prisma.taglineCategory.delete({
        where: { id: req.params.id }
      })

      res.status(204).send()
    } catch (error) {
      return res.status(404).json({ error: 'Tagline category not found or already deleted' })
    }
  })
)

export default router
