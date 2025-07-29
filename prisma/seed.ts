// prisma/seed.ts
import { PrismaClient, Sex, Status, VerificationStatus, MessageStatus, WeekDay, UserRole, UserType, CurrentJobStatus, PostType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
// This is only needed for TypeScript to recognize the Node.js process object
/// <reference types="node" />

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.keyStrength.deleteMany();
  await prisma.businessHour.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.taglineCategory.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.posting.deleteMany();
  await prisma.postingAttachment.deleteMany();

  // Create tagline categories for maritime industry
  const categories = await Promise.all([
    prisma.taglineCategory.create({
      data: { name: 'Maritime Services' }
    }),
    prisma.taglineCategory.create({
      data: { name: 'Crew Management' }
    }),
    prisma.taglineCategory.create({
      data: { name: 'Ship Management' }
    }),
    prisma.taglineCategory.create({
      data: { name: 'Training & Certification' }
    }),
    prisma.taglineCategory.create({
      data: { name: 'Maritime Technology' }
    })
  ]);

  // Encrypt passwords using bcrypt
  const saltRounds = 10;
  const [superAdminPasswordHash, manningAgencyPasswordHash, jobseekerPasswordHash, exhibitorPasswordHash, sponsorPasswordHash] =
    await Promise.all([
      bcrypt.hash('test123', saltRounds),
      bcrypt.hash('test123', saltRounds),
      bcrypt.hash('test123', saltRounds),
      bcrypt.hash('test123', saltRounds),
      bcrypt.hash('test123', saltRounds),
    ]);

  // Create users with different roles
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@maritime.com',
      name: 'Captain John Smith',
      sex: Sex.MALE,
      role: UserRole.SUPERADMIN,
      userType: UserType.SUPERADMIN,
      isEmailVerified: true,
      accounts: {
        create: {
          email: 'superadmin@maritime.com',
          password: superAdminPasswordHash,
        },
      },
    },
    include: { accounts: true },
  });

  const manningAgency1 = await prisma.user.create({
    data: {
      email: 'info@globalcrews.com',
      name: 'Maria Rodriguez',
      sex: Sex.FEMALE,
      role: UserRole.MANNING_AGENCY,
      userType: UserType.CORPORATE_PROFESSIONAL,
      isEmailVerified: true,
      accounts: {
        create: {
          email: 'info@globalcrews.com',
          password: manningAgencyPasswordHash,
        },
      },
    },
    include: { accounts: true },
  });

  const manningAgency2 = await prisma.user.create({
    data: {
      email: 'hr@maritimepersonnel.com',
      name: 'David Chen',
      sex: Sex.MALE,
      role: UserRole.MANNING_AGENCY,
      userType: UserType.CORPORATE_PROFESSIONAL,
      isEmailVerified: true,
      accounts: {
        create: {
          email: 'hr@maritimepersonnel.com',
          password: manningAgencyPasswordHash,
        },
      },
    },
    include: { accounts: true },
  });

  const jobseeker1 = await prisma.user.create({
    data: {
      email: 'captain.anderson@email.com',
      name: 'Captain Michael Anderson',
      sex: Sex.MALE,
      role: UserRole.JOBSEEKER,
      userType: UserType.SEAFARER,
      currentJobStatus: CurrentJobStatus.ACTIVELY_LOOKING,
      isEmailVerified: true,
      accounts: {
        create: {
          email: 'captain.anderson@email.com',
          password: jobseekerPasswordHash,
        },
      },
    },
    include: { accounts: true },
  });

  const jobseeker2 = await prisma.user.create({
    data: {
      email: 'engineer.sarah@email.com',
      name: 'Sarah Johnson',
      sex: Sex.FEMALE,
      role: UserRole.JOBSEEKER,
      userType: UserType.SEAFARER,
      currentJobStatus: CurrentJobStatus.OPEN_TO_OFFERS,
      isEmailVerified: true,
      accounts: {
        create: {
          email: 'engineer.sarah@email.com',
          password: jobseekerPasswordHash,
        },
      },
    },
    include: { accounts: true },
  });

  const exhibitor = await prisma.user.create({
    data: {
      email: 'contact@marinetech.com',
      name: 'Robert Wilson',
      sex: Sex.MALE,
      role: UserRole.EXHIBITOR,
      userType: UserType.CORPORATE_PROFESSIONAL,
      isEmailVerified: true,
      accounts: {
        create: {
          email: 'contact@marinetech.com',
          password: exhibitorPasswordHash,
        },
      },
    },
    include: { accounts: true },
  });

  const sponsor = await prisma.user.create({
    data: {
      email: 'partnerships@oceanfreight.com',
      name: 'Lisa Thompson',
      sex: Sex.FEMALE,
      role: UserRole.SPONSOR,
      userType: UserType.CORPORATE_PROFESSIONAL,
      isEmailVerified: true,
      accounts: {
        create: {
          email: 'partnerships@oceanfreight.com',
          password: sponsorPasswordHash,
        },
      },
    },
    include: { accounts: true },
  });

  // Create manning agency organizations
  const globalCrews = await prisma.organization.create({
    data: {
      name: 'Global Crews International',
      domain: 'globalcrews.com',
      logo: 'https://example.com/globalcrews-logo.png',
      industry: 'Maritime Crew Management',
      description: 'Leading global manning agency providing qualified maritime professionals worldwide. Specializing in crew placement for commercial vessels, cruise ships, and offshore operations.',
      location: 'Singapore',
      phoneNumber: '+65 6789 0123',
      email: 'info@globalcrews.com',
      websiteUrl: 'https://globalcrews.com',
      verificationStatus: VerificationStatus.VERIFIED,
      userId: manningAgency1.id,
      taglineCategories: {
        connect: [{ id: categories[0].id }, { id: categories[1].id }]
      }
    }
  });

  const maritimePersonnel = await prisma.organization.create({
    data: {
      name: 'Maritime Personnel Solutions',
      domain: 'maritimepersonnel.com',
      logo: 'https://example.com/maritimepersonnel-logo.png',
      industry: 'Maritime Recruitment',
      description: 'Comprehensive maritime personnel solutions including crew management, training, and certification services. Serving the global shipping industry since 1995.',
      location: 'Rotterdam, Netherlands',
      phoneNumber: '+31 10 123 4567',
      email: 'hr@maritimepersonnel.com',
      websiteUrl: 'https://maritimepersonnel.com',
      verificationStatus: VerificationStatus.VERIFIED,
      userId: manningAgency2.id,
      taglineCategories: {
        connect: [{ id: categories[1].id }, { id: categories[3].id }]
      }
    }
  });

  const oceanFreight = await prisma.organization.create({
    data: {
      name: 'Ocean Freight Logistics',
      domain: 'oceanfreight.com',
      logo: 'https://example.com/oceanfreight-logo.png',
      industry: 'Maritime Logistics',
      description: 'Comprehensive maritime logistics and freight forwarding services. Connecting global trade through efficient shipping solutions.',
      location: 'Hamburg, Germany',
      phoneNumber: '+49 40 123 4567',
      email: 'partnerships@oceanfreight.com',
      websiteUrl: 'https://oceanfreight.com',
      verificationStatus: VerificationStatus.VERIFIED,
      userId: sponsor.id,
      taglineCategories: {
        connect: [{ id: categories[0].id }, { id: categories[2].id }]
      }
    }
  });

  const marineTech = await prisma.organization.create({
    data: {
      name: 'Marine Technology Solutions',
      domain: 'marinetech.com',
      logo: 'https://example.com/marinetech-logo.png',
      industry: 'Maritime Technology',
      description: 'Innovative maritime technology solutions including navigation systems, safety equipment, and digital transformation services.',
      location: 'Oslo, Norway',
      phoneNumber: '+47 22 123 456',
      email: 'contact@marinetech.com',
      websiteUrl: 'https://marinetech.com',
      verificationStatus: VerificationStatus.PENDING,
      userId: exhibitor.id,
      taglineCategories: {
        connect: [{ id: categories[4].id }]
      }
    }
  });

  // Add business hours for manning agencies
  await prisma.businessHour.createMany({
    data: [
      // Global Crews - 24/7 operations
      { dayOfWeek: WeekDay.MONDAY, openTime: "00:00", closeTime: "23:59", organizationId: globalCrews.id },
      { dayOfWeek: WeekDay.TUESDAY, openTime: "00:00", closeTime: "23:59", organizationId: globalCrews.id },
      { dayOfWeek: WeekDay.WEDNESDAY, openTime: "00:00", closeTime: "23:59", organizationId: globalCrews.id },
      { dayOfWeek: WeekDay.THURSDAY, openTime: "00:00", closeTime: "23:59", organizationId: globalCrews.id },
      { dayOfWeek: WeekDay.FRIDAY, openTime: "00:00", closeTime: "23:59", organizationId: globalCrews.id },
      { dayOfWeek: WeekDay.SATURDAY, openTime: "00:00", closeTime: "23:59", organizationId: globalCrews.id },
      { dayOfWeek: WeekDay.SUNDAY, openTime: "00:00", closeTime: "23:59", organizationId: globalCrews.id },
      
      // Maritime Personnel - Standard business hours
      { dayOfWeek: WeekDay.MONDAY, openTime: "08:00", closeTime: "18:00", organizationId: maritimePersonnel.id },
      { dayOfWeek: WeekDay.TUESDAY, openTime: "08:00", closeTime: "18:00", organizationId: maritimePersonnel.id },
      { dayOfWeek: WeekDay.WEDNESDAY, openTime: "08:00", closeTime: "18:00", organizationId: maritimePersonnel.id },
      { dayOfWeek: WeekDay.THURSDAY, openTime: "08:00", closeTime: "18:00", organizationId: maritimePersonnel.id },
      { dayOfWeek: WeekDay.FRIDAY, openTime: "08:00", closeTime: "17:00", organizationId: maritimePersonnel.id },
      { dayOfWeek: WeekDay.SATURDAY, openTime: "09:00", closeTime: "14:00", organizationId: maritimePersonnel.id },
      { dayOfWeek: WeekDay.SUNDAY, openTime: "00:00", closeTime: "00:00", isClosed: true, organizationId: maritimePersonnel.id }
    ]
  });

  // Add key strengths for manning agencies
  await prisma.keyStrength.createMany({
    data: [
      {
        title: 'Global Network',
        description: 'Extensive network of qualified maritime professionals across 50+ countries',
        organizationId: globalCrews.id
      },
      {
        title: '24/7 Support',
        description: 'Round-the-clock crew support and emergency response services',
        organizationId: globalCrews.id
      },
      {
        title: 'Compliance Expertise',
        description: 'Deep knowledge of international maritime regulations and certification requirements',
        organizationId: globalCrews.id
      },
      {
        title: 'Training Excellence',
        description: 'Comprehensive training programs and certification services for maritime professionals',
        organizationId: maritimePersonnel.id
      },
      {
        title: 'Quality Assurance',
        description: 'Rigorous screening and quality assurance processes for all crew placements',
        organizationId: maritimePersonnel.id
      },
      {
        title: 'Technology Integration',
        description: 'Advanced digital platforms for efficient crew management and communication',
        organizationId: maritimePersonnel.id
      }
    ]
  });

  // Add team members for manning agencies
  await prisma.teamMember.create({
    data: {
      name: 'Captain Maria Rodriguez',
      title: 'CEO & Founder',
      description: 'Former Master Mariner with 20+ years of maritime experience. Founded Global Crews in 2010.',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/mariarodriguez',
        twitter: 'https://twitter.com/mariarodriguez'
      },
      organizationId: globalCrews.id
    }
  });

  await prisma.teamMember.create({
    data: {
      name: 'James O\'Connor',
      title: 'Head of Operations',
      description: 'Experienced maritime operations manager specializing in crew logistics and vessel management.',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/jamesoconnor',
        twitter: 'https://twitter.com/jamesoconnor'
      },
      organizationId: globalCrews.id
    }
  });

  await prisma.teamMember.create({
    data: {
      name: 'David Chen',
      title: 'Managing Director',
      description: 'Maritime industry veteran with expertise in international crew management and regulatory compliance.',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/davidchen',
        twitter: 'https://twitter.com/davidchen'
      },
      organizationId: maritimePersonnel.id
    }
  });

  await prisma.teamMember.create({
    data: {
      name: 'Elena Petrova',
      title: 'Training Director',
      description: 'Certified maritime instructor with 15+ years of experience in crew training and development.',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/elenapetrova',
        twitter: 'https://twitter.com/elenapetrova'
      },
      organizationId: maritimePersonnel.id
    }
  });

  // Add reviews for manning agencies
  await prisma.review.create({
    data: {
      rating: 5,
      description: 'Excellent service! Global Crews helped me find a great position as Chief Officer. Very professional and responsive team.',
      likes: 25,
      responses: {
        business: 'Thank you Captain Anderson! We\'re glad we could help you find the right opportunity.',
        date: '2024-01-15'
      },
      writtenBy: 'Captain Michael Anderson',
      organizationId: globalCrews.id
    }
  });

  await prisma.review.create({
    data: {
      rating: 4,
      description: 'Good experience with Maritime Personnel. They provided comprehensive training before my placement.',
      likes: 18,
      writtenBy: 'Sarah Johnson',
      organizationId: maritimePersonnel.id
    }
  });

  await prisma.review.create({
    data: {
      rating: 5,
      description: 'Outstanding crew management services. They handle everything professionally and efficiently.',
      likes: 32,
      responses: {
        business: 'Thank you for your trust in our services!',
        date: '2024-02-20'
      },
      writtenBy: 'Captain Robert Davis',
      organizationId: globalCrews.id
    }
  });

  // Create job postings
  await prisma.posting.create({
    data: {
      title: 'Chief Engineer - Container Vessel',
      content: 'We are seeking an experienced Chief Engineer for a 5000 TEU container vessel. Requirements: STCW III/2, 3+ years as Chief Engineer, experience with MAN B&W engines. Contract: 4 months on/2 months off. Competitive salary and benefits.',
      postType: PostType.JOB_LISTING,
      isPublished: true,
      organizationId: globalCrews.id,
      createdById: manningAgency1.id
    }
  });

  await prisma.posting.create({
    data: {
      title: 'Master Mariner - Bulk Carrier',
      content: 'Urgent requirement for Master Mariner on 50,000 DWT bulk carrier. Route: Asia to Europe. Requirements: STCW II/2, 2+ years as Master, experience with bulk carriers. Immediate start available.',
      postType: PostType.JOB_LISTING,
      isPublished: true,
      organizationId: globalCrews.id,
      createdById: manningAgency1.id
    }
  });

  await prisma.posting.create({
    data: {
      title: 'Second Officer - Oil Tanker',
      content: 'Second Officer position available on VLCC. Requirements: STCW II/1, 1+ year as Second Officer, tanker experience preferred. Contract: 3 months on/3 months off.',
      postType: PostType.JOB_LISTING,
      isPublished: true,
      organizationId: maritimePersonnel.id,
      createdById: manningAgency2.id
    }
  });

  await prisma.posting.create({
    data: {
      title: 'Maritime Training Program - STCW Courses',
      content: 'Comprehensive STCW training programs available. Courses include: Basic Safety Training, Advanced Firefighting, Medical First Aid, and more. Next session starts March 1st, 2024.',
      postType: PostType.ANNOUNCEMENT,
      isPublished: true,
      organizationId: maritimePersonnel.id,
      createdById: manningAgency2.id
    }
  });

  await prisma.posting.create({
    data: {
      title: 'Maritime Technology Exhibition 2024',
      content: 'Join us at the annual Maritime Technology Exhibition in Rotterdam. Showcasing the latest innovations in navigation, safety, and digital transformation. Free entry for registered maritime professionals.',
      postType: PostType.EVENT,
      isPublished: true,
      organizationId: marineTech.id,
      createdById: exhibitor.id
    }
  });

  // Create messages between users
  await prisma.message.create({
    data: {
      content: 'Hi Captain Anderson, I saw your profile and we have a Chief Officer position that might interest you. Are you available for a call?',
      status: MessageStatus.SENT,
      hasAttachments: false,
      userId: jobseeker1.id,
      senderId: manningAgency1.id
    }
  });

  await prisma.message.create({
    data: {
      content: 'Hello Sarah, thank you for your interest in our training programs. I\'ve attached our course catalog for your review.',
      status: MessageStatus.DELIVERED,
      hasAttachments: true,
      userId: jobseeker2.id,
      senderId: manningAgency2.id
    }
  });

  // Create notifications
  // System notifications for super admin
  await prisma.$executeRaw`INSERT INTO "Notification" (id, content, type, status, "createdAt", "updatedAt", "userId") 
  VALUES (gen_random_uuid(), 'Welcome to Maritime Portal! You have full administrative access.', 'SYSTEM', 'UNREAD', NOW(), NOW(), ${superAdmin.id}::uuid)`;
  
  // Job notifications for jobseekers
  await prisma.$executeRaw`INSERT INTO "Notification" (id, content, type, status, "createdAt", "updatedAt", "userId") 
  VALUES (gen_random_uuid(), 'New job posting: Chief Engineer position available', 'MESSAGE', 'UNREAD', NOW(), NOW(), ${jobseeker1.id}::uuid)`;
  
  await prisma.$executeRaw`INSERT INTO "Notification" (id, content, type, status, "createdAt", "updatedAt", "userId") 
  VALUES (gen_random_uuid(), 'Training program registration confirmed', 'ACCOUNT', 'READ', NOW(), NOW(), ${jobseeker2.id}::uuid)`;
  
  // Business notifications for manning agencies
  await prisma.$executeRaw`INSERT INTO "Notification" (id, content, type, status, "createdAt", "updatedAt", "userId") 
  VALUES (gen_random_uuid(), 'New application received for Chief Officer position', 'BUSINESS', 'UNREAD', NOW(), NOW(), ${manningAgency1.id}::uuid)`;
  
  await prisma.$executeRaw`INSERT INTO "Notification" (id, content, type, status, "createdAt", "updatedAt", "userId") 
  VALUES (gen_random_uuid(), 'Training session scheduled for March 1st', 'BUSINESS', 'READ', NOW(), NOW(), ${manningAgency2.id}::uuid)`;

  console.log('Database seeded successfully with maritime industry data!');
  console.log('Created users:');
  console.log('- Super Admin:', superAdmin.email);
  console.log('- Manning Agencies:', manningAgency1.email, manningAgency2.email);
  console.log('- Job Seekers:', jobseeker1.email, jobseeker2.email);
  console.log('- Exhibitor:', exhibitor.email);
  console.log('- Sponsor:', sponsor.email);
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1); 
  })
  .finally(async () => {
    await prisma.$disconnect();
  });