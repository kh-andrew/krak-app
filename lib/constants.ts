export const KRAK_ORANGE = '#FF6B4A'
export const KRAK_BLACK = '#0A0A0A'

export const ORDER_STATUS_FLOW = {
  RECEIVED: {
    label: 'Received',
    color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    shopifyStatus: 'pending',
    next: ['PREPARING'],
  },
  PREPARING: {
    label: 'Preparing',
    color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    shopifyStatus: 'processing',
    next: ['OUT_FOR_DELIVERY'],
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    shopifyStatus: 'shipped',
    next: ['DELIVERED', 'FAILED'],
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-500/20 text-green-400 border border-green-500/30',
    shopifyStatus: 'fulfilled',
    next: [],
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-red-500/20 text-red-400 border border-red-500/30',
    shopifyStatus: 'unfulfilled',
    next: ['OUT_FOR_DELIVERY'],
  },
} as const

export type OrderStatusKey = keyof typeof ORDER_STATUS_FLOW
