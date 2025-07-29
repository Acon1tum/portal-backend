import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.organization.delete({ where: { id } })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting business:', error)
    res.status(500).json({ error: 'An error occurred while deleting the business.' })
  }
})

export default router
