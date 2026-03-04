const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Check locations schema
    const result = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='locations'`
    console.log('Locations columns:', result)
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()