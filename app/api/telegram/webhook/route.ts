// Telegram webhook handler for Krak app
// Add this to: app/api/telegram/webhook/route.ts

import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Validate Telegram webhook secret
function validateSecret(token: string): boolean {
  return token === process.env.TELEGRAM_WEBHOOK_SECRET
}

// Send message back to Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  })
}

// Handle /receive command
async function handleReceive(args: string[], chatId: number) {
  // Parse: /receive KFSB 27 A260304A Replenishment
  if (args.length < 3) {
    await sendTelegramMessage(chatId, '❌ Usage: `/receive [SKU] [quantity] [batch-code] [notes]`\nExample: `/receive KFSB 27 A260304A From supplier`')
    return
  }
  
  const sku = args[0].toUpperCase()
  const quantity = parseInt(args[1])
  const batchCode = args[2].toUpperCase()
  const notes = args.slice(3).join(' ') || 'Received via Telegram'
  
  if (isNaN(quantity) || quantity <= 0) {
    await sendTelegramMessage(chatId, '❌ Quantity must be a positive number')
    return
  }
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/inventory/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, quantity, batchCode, notes })
    })
    
    const result = await response.json()
    
    if (result.success) {
      let message = `✅ *Stock Received*\n\n`
      message += `*SKU:* ${result.sku}\n`
      message += `*Quantity:* +${result.quantity}\n`
      message += `*Batch:* ${batchCode}\n`
      if (result.totalBottles && result.totalBottles !== result.quantity) {
        message += `*Total Bottles:* ${result.totalBottles.toLocaleString()}\n`
      }
      message += `*Notes:* ${notes}`
      await sendTelegramMessage(chatId, message)
    } else {
      await sendTelegramMessage(chatId, `❌ Error: ${result.error || 'Failed to receive stock'}`)
    }
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ Error connecting to inventory system`)
  }
}

// Handle /stock command (adjustment)
async function handleStock(args: string[], chatId: number) {
  // Parse: /stock KFSS -10 sample Given to cafe
  if (args.length < 3) {
    await sendTelegramMessage(chatId, '❌ Usage: `/stock [SKU] [+/-quantity] [reason] [notes]`\nReasons: sample, giveaway, damage, expired, correction, personal')
    return
  }
  
  const sku = args[0].toUpperCase()
  const quantity = parseInt(args[1])
  const reason = args[2].toLowerCase()
  const notes = args.slice(3).join(' ') || 'Stock adjustment via Telegram'
  
  const validReasons = ['sample', 'giveaway', 'damage', 'expired', 'correction', 'personal']
  if (!validReasons.includes(reason)) {
    await sendTelegramMessage(chatId, `❌ Invalid reason. Use: ${validReasons.join(', ')}`)
    return
  }
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, quantity, reason, notes })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      const sign = quantity >= 0 ? '+' : ''
      await sendTelegramMessage(chatId, `✅ *Stock Adjusted*\n\n*SKU:* ${sku}\n*Change:* ${sign}${quantity}\n*Reason:* ${reason}\n*New Stock:* ${result.newStock || 'N/A'}`)
    } else {
      await sendTelegramMessage(chatId, `❌ Error: ${result.error || 'Failed to adjust stock'}`)
    }
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ Error connecting to inventory system`)
  }
}

// Handle /pending command
async function handlePending(chatId: number) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/pending-delivery`)
    const orders = await response.json()
    
    if (!orders.length) {
      await sendTelegramMessage(chatId, '📦 No pending deliveries')
      return
    }
    
    let message = `📦 *Pending Deliveries (${orders.length})*\n\n`
    orders.slice(0, 10).forEach((order: any, i: number) => {
      message += `${i + 1}. *${order.shopifyOrderNumber || order.id.slice(0, 8)}*\n`
      message += `   ${order.customer?.firstName || ''} ${order.customer?.lastName || ''}\n`
      message += `   ${order.delivery?.deliveryAddress?.slice(0, 30) || 'No address'}...\n\n`
    })
    
    if (orders.length > 10) {
      message += `_...and ${orders.length - 10} more_`
    }
    
    await sendTelegramMessage(chatId, message)
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ Error fetching pending deliveries`)
  }
}

// Handle /deliver command
async function handleDeliver(args: string[], chatId: number) {
  if (args.length < 1) {
    await sendTelegramMessage(chatId, '❌ Usage: `/deliver [order-id]`')
    return
  }
  
  const orderId = args[0]
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}/delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        deliveredAt: new Date().toISOString(),
        notes: 'Marked delivered via Telegram'
      })
    })
    
    if (response.ok) {
      await sendTelegramMessage(chatId, `✅ Order *${orderId}* marked as delivered`)
    } else {
      const error = await response.json()
      await sendTelegramMessage(chatId, `❌ Error: ${error.error || 'Failed to update delivery'}`)
    }
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ Error connecting to delivery system`)
  }
}

// Main webhook handler
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Log for debugging
    console.log('Telegram webhook:', JSON.stringify(body, null, 2))
    
    const message = body.message || body.edited_message
    if (!message || !message.text) {
      return NextResponse.json({ ok: true })
    }
    
    const chatId = message.chat.id
    const text = message.text.trim()
    const parts = text.split(' ')
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)
    
    // Route commands
    switch (command) {
      case '/receive':
        await handleReceive(args, chatId)
        break
      case '/stock':
        await handleStock(args, chatId)
        break
      case '/pending':
        await handlePending(chatId)
        break
      case '/deliver':
        await handleDeliver(args, chatId)
        break
      case '/start':
        await sendTelegramMessage(chatId, '👋 *Krak Inventory Bot*\n\nCommands:\n`/receive [SKU] [qty] [batch] [notes]` - Receive stock\n`/stock [SKU] [+/-qty] [reason] [notes]` - Adjust stock\n`/pending` - View pending deliveries\n`/deliver [order-id]` - Mark delivered')
        break
      default:
        // Unknown command - ignore
        break
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}