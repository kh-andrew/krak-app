import { prisma } from '../lib/prisma'

async function seedInventory() {
  console.log('Seeding inventory...')
  
  const sampleInventory = [
    {
      sku: 'UDT-120',
      name: 'Unlimited Double Touch - 120',
      currentStock: 150,
      reserved: 25,
      available: 125,
      reorderPoint: 50,
      reorderQty: 100,
    },
    {
      sku: 'UDT-103',
      name: 'Unlimited Double Touch - 103',
      currentStock: 80,
      reserved: 15,
      available: 65,
      reorderPoint: 40,
      reorderQty: 80,
    },
    {
      sku: '3D-HYDRA-001',
      name: '3D Hydra Lip Oil - 01',
      currentStock: 200,
      reserved: 50,
      available: 150,
      reorderPoint: 75,
      reorderQty: 150,
    },
    {
      sku: '3D-HYDRA-002',
      name: '3D Hydra Lip Oil - 02',
      currentStock: 30,
      reserved: 10,
      available: 20,
      reorderPoint: 40,
      reorderQty: 100,
    },
    {
      sku: 'ONE-HAND-004',
      name: 'One Hand Lipstick - 04',
      currentStock: 500,
      reserved: 100,
      available: 400,
      reorderPoint: 150,
      reorderQty: 300,
    },
    {
      sku: 'ONE-HAND-005',
      name: 'One Hand Lipstick - 05',
      currentStock: 15,
      reserved: 5,
      available: 10,
      reorderPoint: 30,
      reorderQty: 100,
    },
  ]
  
  for (const item of sampleInventory) {
    try {
      // Find or create product
      let product = await prisma.product.findUnique({
        where: { sku: item.sku }
      })
      
      if (!product) {
        product = await prisma.product.create({
          data: {
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
            productId: product.id,
            currentStock: item.currentStock || 0,
            available: item.available || 0,
            reserved: item.reserved || 0,
            reorderPoint: item.reorderPoint,
            reorderQty: item.reorderQty,
          },
        })
      }
    } catch (error) {
      console.error(`Failed to seed ${item.sku}:`, error)
    }
  }
  
  console.log(`Seeded ${sampleInventory.length} inventory items`)
}

seedInventory()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
