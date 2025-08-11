import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Only allow updating specific fields for security
    const allowedFields = [
      'name', 'domain', 'logo', 'industry', 'description', 'location', 
      'phoneNumber', 'email', 'websiteUrl', 'verificationStatus',
      'profilePicture', 'coverPhoto'
    ];
    const filteredData: any = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const updated = await prisma.organization.update({
      where: { id },
      data: filteredData,
      select: {
        id: true,
        name: true,
        domain: true,
        logo: true,
        industry: true,
        description: true,
        location: true,
        phoneNumber: true,
        email: true,
        websiteUrl: true,
        verificationStatus: true,
        profilePicture: true,
        coverPhoto: true
      }
    })

    res.json(updated)
  } catch (error) {
    console.error('Error updating business:', error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    res.status(500).json({ error: 'An error occurred while updating the business.' })
  }
})

export default router
