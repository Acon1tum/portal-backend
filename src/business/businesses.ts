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

// Update organization profile (including profile picture and cover photo)
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { profilePicture, coverPhoto, name, domain, logo, industry, description, location, phoneNumber, email, websiteUrl, verificationStatus } = req.body;

    const updateData: any = {};
    
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (coverPhoto !== undefined) updateData.coverPhoto = coverPhoto;
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (logo !== undefined) updateData.logo = logo;
    if (industry !== undefined) updateData.industry = industry;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (email !== undefined) updateData.email = email;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (verificationStatus !== undefined) updateData.verificationStatus = verificationStatus;

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        taglineCategories: true
      },
    });

    res.json(updatedOrganization);
  })
)

export default router
