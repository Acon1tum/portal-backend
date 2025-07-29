// users/createUser.ts
import { Router, Request, Response } from 'express';
import { PrismaClient, UserRole, UserType, CurrentJobStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();
const saltRounds = 10;

router.post('/', async (req: Request, res: Response) => {
  try {
    // Extract user and account data from the request body
    const { email, name, sex, role, userType, currentJobStatus, account } = req.body;

    // Encrypt the password using bcrypt before saving to the database
    const hashedPassword = await bcrypt.hash(account.password, saltRounds);

    // Create a new user along with an associated account using nested writes.
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        sex,
        role: role || UserRole.VISITOR, // Default to VISITOR if not provided
        userType: userType || null,
        currentJobStatus: currentJobStatus || null,
        accounts: {
          create: {
            email: account.email || email,
            password: hashedPassword,
          },
        },
      },
      include: {
        accounts: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'An error occurred while creating the user.' });
  }
});

export default router;
