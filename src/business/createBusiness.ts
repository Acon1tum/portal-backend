import { Router, Request, Response } from 'express'
import { PrismaClient, VerificationStatus } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const prisma = new PrismaClient()

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      name,
      domain,
      logo,
      industry,
      description,
      location,
      phoneNumber,
      email,
      websiteUrl,
      userId,
      verificationStatus
    } = req.body

    const missingFields: string[] = []

    if (!name) missingFields.push('name')
    if (!domain) missingFields.push('domain')
    if (!industry) missingFields.push('industry')
    if (!description) missingFields.push('description')
    if (!location) missingFields.push('location')
    if (!phoneNumber) missingFields.push('phoneNumber')
    if (!email) missingFields.push('email')
    if (!userId) missingFields.push('userId')

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required field(s)',
        missing: missingFields
      })
    }

    const newBusiness = await prisma.organization.create({
      data: {
        name,
        domain,
        logo,
        industry,
        description,
        location,
        phoneNumber,
        email,
        websiteUrl,
        userId,
        verificationStatus: verificationStatus ?? VerificationStatus.PENDING
      }
    })

    res.status(201).json(newBusiness)
  })
)

export default router
