'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InventoryForm({ item, onSuccess }: { item?: any, onSuccess?: () => void }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    sku: item?.sku || '',
    name: item?.name || '',
    currentStock: item?.currentStock || 0,
    reorderPoint: item?.reorderPoint || 0,
    reorderQty: item?.reorderQty || 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = item?.id ? `/api/inventory/${item.id}` : '/api/inventory'
      const method = item?.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save')

      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error('Error saving inventory:', error)
      alert('Failed to save inventory item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">SKU</label>
        <input
          type="text"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white"
          placeholder="e.g., UDT-120"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white"
          placeholder="e.g., Unlimited Double Touch - 120"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Current Stock</label>
          <input
            type="number"
            value={formData.currentStock}
            onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Reorder Point</label>
          <input
            type="number"
            value={formData.reorderPoint}
            onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white"
            min="0"
            placeholder="Alert when below"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Reorder Qty</label>
          <input
            type="number"
            value={formData.reorderQty}
            onChange={(e) => setFormData({ ...formData, reorderQty: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white"
            min="0"
            placeholder="Suggested order qty"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#FF6B4A] hover:bg-[#FF8566] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : item?.id ? 'Update' : 'Add Item'}
        </button>
      </div>
    </form>
  )
}