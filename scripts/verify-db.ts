import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Check User table
    const userCount = await prisma.user.count()
    console.log(`✅ User table exists (${userCount} records)`)

    // Check Company table
    const companyCount = await prisma.company.count()
    console.log(`✅ Company table exists (${companyCount} records)`)

    console.log('\n🎉 Database setup complete!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verify()

