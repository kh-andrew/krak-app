const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Check if Location table exists
    const locations = await prisma.location.findMany()
    console.log('Locations:', locations)
    
    // Check products
    const products = await prisma.product.findMany()
    console.log('Products:', products)
    
    // Check inventory
    const inventory = await prisma.inventory.findMany({
      include: { product: true, location: true }
    })
    console.log('Inventory:', inventory)
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()