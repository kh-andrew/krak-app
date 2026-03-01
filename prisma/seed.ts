import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Check if users already exist
  const userCount = await prisma.user.count()
  
  if (userCount > 0) {
    console.log('Database already seeded')
    return
  }
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  })
  
  console.log('Created admin user:', admin.email)
  
  // Create sample team members
  const teamPassword = await bcrypt.hash('password123', 12)
  
  const operator = await prisma.user.create({
    data: {
      email: 'operator@example.com',
      password: teamPassword,
      name: 'Operator User',
      role: UserRole.OPERATOR,
    },
  })
  
  const driver1 = await prisma.user.create({
    data: {
      email: 'driver1@example.com',
      password: teamPassword,
      name: 'Driver One',
      role: UserRole.DRIVER,
    },
  })
  
  const driver2 = await prisma.user.create({
    data: {
      email: 'driver2@example.com',
      password: teamPassword,
      name: 'Driver Two',
      role: UserRole.DRIVER,
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
