import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function seedInventory() {
  console.log('Seeding inventory...')
  
  const sampleInventory = [
    {
      sku: 'KFSS',
      name: 'Krak Single Shot',
      currentStock: 1000,
      reserved: 100,
      available: 900,
      reorderPoint: 500,
      reorderQty: 1000,
    },
    {
      sku: 'KFSP',
      name: 'Krak Shot Pack (12x)',
      currentStock: 100,
      reserved: 10,
      available: 90,
      reorderPoint: 50,
      reorderQty: 100,
    },
    {
      sku: 'KFSB',
      name: 'Krak Shot Box (240x)',
      currentStock: 20,
      reserved: 5,
      available: 15,
      reorderPoint: 10,
      reorderQty: 20,
    },
  ]
  
  for (const item of sampleInventory) {
    try {
      // Find or create product (PascalCase model -> camelCase in client)
      let product = await prisma.product.findUnique({
        where: { sku: item.sku }
      })
      
      if (!product) {
        product = await prisma.product.create({
          data: {
            id: randomUUID(),
            sku: item.sku,
            name: item.name,
            basePrice: 0,
          }
        })
      }
      
      // Check if inventory exists
      const existingInventory = await prisma.inventory.findFirst({
        where: { productId: product.id }
      })
      
      if (existingInventory) {
        await prisma.inventory.update({
          where: { id: existingInventory.id },
          data: {
            currentStock: item.currentStock,
            available: item.available,
            reserved: item.reserved,
          },
        })
      } else {
        await prisma.inventory.create({
          data: {
            id: randomUUID(),
            productId: product.id,
            currentStock: item.currentStock || 0,
            available: item.available || 0,
            reserved: item.reserved || 0,
            reorderPoint: item.reorderPoint,
            reorderQty: item.reorderQty,
          },
        })
      }
      
      console.log(`Seeded ${item.sku}`)
    } catch (error) {
      console.error(`Failed to seed ${item.sku}:`, error)
    }
  }
  
  console.log(`Seeded ${sampleInventory.length} inventory items`)
}

seedInventory()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
