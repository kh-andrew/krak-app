const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Test location query like the API does
    const location = await prisma.location.findFirst({ where: { code: 'WH-HK-01' } })
    console.log('Location:', location)
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()