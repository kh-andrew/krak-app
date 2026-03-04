const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='locations' AND column_name='isActive'`
    console.log('isActive column exists:', result.length > 0)
    if (result.length > 0) {
      console.log('Column details:', result)
    }
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()