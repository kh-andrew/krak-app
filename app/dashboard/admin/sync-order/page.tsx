'use client'

import { useState } from 'react'

export default function ManualOrderSync() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    shopifyOrderId: '',
    shopifyOrderNumber: '',
    customerName: '',
    email: '',
    phone: '',
    totalAmount: '',
    currency: 'HKD',
    productName: 'krak Focus Shot',
    quantity: '1',
    sku: 'KFSP',
    address1: '',
    address2: '',
    city: '',
    province: '',
    country: 'Hong Kong SAR',
    zip: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const [firstName, ...lastNameParts] = formData.customerName.split(' ')
      const lastName = lastNameParts.join(' ')
      
      const email = formData.email || `order-${formData.shopifyOrderId}@placeholder.com`
      
      const response = await fetch('/api/admin/sync-shopify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopifyOrderId: formData.shopifyOrderId,
          shopifyOrderNumber: formData.shopifyOrderNumber || `#${formData.shopifyOrderId}`,
          email,
          totalAmount: formData.totalAmount,
          currency: formData.currency,
          lineItems: [{
            title: formData.productName,
            quantity: parseInt(formData.quantity),
            price: formData.totalAmount,
            sku: formData.sku,
          }],
          customer: {
            first_name: firstName,
            last_name: lastName,
            phone: formData.phone,
          },
          shippingAddress: {
            name: formData.customerName,
            address1: formData.address1,
            address2: formData.address2,
            city: formData.city,
            province: formData.province,
            country: formData.country,
            zip: formData.zip,
          },
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Manual Shopify Order Sync</h2>
      <p className="text-gray-600 mb-4">Use this to sync orders that missed the webhook.</p>
      
      {result && (
        <div className={`p-4 rounded mb-4 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.success ? `✅ ${result.message}` : `❌ ${result.error}`}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Shopify Order ID *</label>
            <input
              type="text"
              value={formData.shopifyOrderId}
              onChange={(e) => setFormData({...formData, shopifyOrderId: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="11089"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order Number</label>
            <input
              type="text"
              value={formData.shopifyOrderNumber}
              onChange={(e) => setFormData({...formData, shopifyOrderNumber: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="#11089"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Customer Name *</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="Tobia Chiu"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="customer@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="+852 6710 0447"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Total Amount *</label>
            <input
              type="text"
              value={formData.totalAmount}
              onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="420.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
              className="w-full border rounded px-3 py-2"
            >
              <option value="HKD">HKD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <select
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              className="w-full border rounded px-3 py-2"
            >
              <option value="KFSS">KFSS (Single)</option>
              <option value="KFSP">KFSP (12 Pack)</option>
              <option value="KFSB">KFSB (Box)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Shipping Address 1 *</label>
          <input
            type="text"
            value={formData.address1}
            onChange={(e) => setFormData({...formData, address1: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="500 Hennessy Road"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Shipping Address 2</label>
          <input
            type="text"
            value={formData.address2}
            onChange={(e) => setFormData({...formData, address2: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="2803 Hysan Place"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="Causeway Bay"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Province</label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => setFormData({...formData, province: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="Hong Kong Island"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ZIP</label>
            <input
              type="text"
              value={formData.zip}
              onChange={(e) => setFormData({...formData, zip: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder=""
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Syncing...' : 'Sync Order to KOMT'}
        </button>
      </form>
    </div>
  )
}
