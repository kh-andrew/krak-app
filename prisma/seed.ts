import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  // Check if users already exist
  const userCount = await prisma.users.count()
  
  if (userCount > 0) {
    console.log('Database already seeded')
    return
  }
  
  const now = new Date()
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.users.create({
    data: {
      id: randomUUID(),
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      updatedAt: now,
    },
  })
  
  console.log('Created admin user:', admin.email)
  
  // Create sample team members
  const teamPassword = await bcrypt.hash('password123', 12)
  
  const operator = await prisma.users.create({
    data: {
      id: randomUUID(),
      email: 'operator@example.com',
      password: teamPassword,
      name: 'Operator User',
      role: UserRole.OPERATOR,
      updatedAt: now,
    },
  })
  
  const driver1 = await prisma.users.create({
    data: {
      id: randomUUID(),
      email: 'driver1@example.com',
      password: teamPassword,
      name: 'Driver One',
      role: UserRole.DRIVER,
      updatedAt: now,
    },
  })
  
  const driver2 = await prisma.users.create({
    data: {
      id: randomUUID(),
      email: 'driver2@example.com',
      password: teamPassword,
      name: 'Driver Two',
      role: UserRole.DRIVER,
      updatedAt: now,
    },
  })
  
  console.log('Created team members:')
  console.log('-', operator.email, '(operator)')
  console.log('-', driver1.email, '(driver)')
  console.log('-', driver2.email, '(driver)')
  
  console.log('\nSeed completed!')
  console.log('\nLogin credentials:')
  console.log('Admin: admin@example.com / admin123')
  console.log('Others: [email] / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
