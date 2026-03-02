'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CSVUpload() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      // Parse CSV (expecting: sku,name,currentStock,reorderPoint,reorderQty)
      const parsed = lines.slice(1).map(line => {
        const [sku, name, currentStock, reorderPoint, reorderQty] = line.split(',')
        return {
          sku: sku?.trim(),
          name: name?.trim(),
          currentStock: parseInt(currentStock) || 0,
          reorderPoint: parseInt(reorderPoint) || 0,
          reorderQty: parseInt(reorderQty) || 0,
        }
      }).filter(item => item.sku && item.name)

      setPreview(parsed.slice(0, 5)) // Show first 5 for preview
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (preview.length === 0) return

    setIsUploading(true)
    try {
      const response = await fetch('/api/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: preview }),
      })

      if (!response.ok) throw new Error('Failed to upload')

      alert(`Successfully uploaded ${preview.length} items`)
      router.refresh()
      setPreview([])
    } catch (error) {
      console.error('Error uploading:', error)
      alert('Failed to upload inventory')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-[#141414] p-6 rounded-xl border border-[#2A2A2A] space-y-4">
      <h3 className="text-lg font-semibold text-white">Bulk Upload (CSV)</h3>
      
      <p className="text-sm text-gray-400">
        Upload a CSV file with columns: sku, name, currentStock, reorderPoint, reorderQty
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#2A2A2A] file:text-white hover:file:bg-[#3A3A3A]"
      />

      {preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Preview (first 5 rows):</p>
          <div className="bg-[#1A1A1A] rounded-lg p-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-left px-2">SKU</th>
                  <th className="text-left px-2">Name</th>
                  <th className="text-right px-2">Stock</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {preview.map((item, i) => (
                  <tr key={i}>
                    <td className="px-2">{item.sku}</td>
                    <td className="px-2">{item.name}</td>
                    <td className="text-right px-2">{item.currentStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-[#FF6B4A] hover:bg-[#FF8566] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : `Upload ${preview.length} Items`}
          </button>
        </div>
      )}
    </div>
  )
}