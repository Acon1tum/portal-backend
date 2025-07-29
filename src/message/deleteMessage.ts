import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.message.delete({
      where: { id: req.params.id }
    })

    res.status(204).send()
  })
)

export default router
