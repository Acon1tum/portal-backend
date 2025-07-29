import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'New tagline name is required' })
    }

    try {
      const updated = await prisma.taglineCategory.update({
        where: { id: req.params.id },
        data: { name }
      })

      res.json(updated)
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as any).code === 'P2002'
      ) {
        return res.status(409).json({ error: 'Tagline category name must be unique' })
      }

      throw error
    }
  })
)

export default router
