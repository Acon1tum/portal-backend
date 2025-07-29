// signup-email-and-pass/signup.ts

import express, { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

dotenv.config()

const router = express.Router()
const prisma = new PrismaClient()

/**
 * Wraps async route handlers so we don't have to write try/catch everywhere.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next)

/**
 * POST /
 * Sign up a new user with email & password,
 * create User & Account records in database.
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // 1) Check if email already exists
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    })
    if (existingAccount) {
      res.status(400).json({ error: 'Email already registered' })
      return
    }

    // 2) Hash the password for storage
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3) Create User record
    const userRecord = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        sex: 'MALE',
        isEmailVerified: false,
      },
    })

    // 4) Create Account record
    await prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        userId: userRecord.id,
        status: 'ACTIVE',
      },
    })

    // 5) Respond
    res.status(201).json({
      message: 'Signup successful.',
      user: userRecord,
    })
  })
)

export default router
