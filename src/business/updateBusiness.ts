import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const updated = await prisma.organization.update({
      where: { id },
      data: updateData
    })

    res.json(updated)
  } catch (error) {
    console.error('Error updating business:', error)
    res.status(500).json({ error: 'An error occurred while updating the business.' })
  }
})

export default router
