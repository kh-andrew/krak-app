'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'FAILED', label: 'Failed' },
]

const COUNTRY_OPTIONS = [
  { value: 'ALL', label: 'All Countries' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Indonesia', label: 'Indonesia' },
]

interface OrderFiltersProps {
  status?: string
  dateFrom?: string
  dateTo?: string
  country?: string
}

export function OrderFilters({ status, dateFrom, dateTo, country }: OrderFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'ALL') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/dashboard')
  }

  const hasFilters = status || dateFrom || dateTo || country

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">Status</label>
        <select
          value={status || 'ALL'}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B4A]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">From Date</label>
        <input
          type="date"
          value={dateFrom || ''}
          onChange={(e) => updateFilter('dateFrom', e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B4A]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">To Date</label>
        <input
          type="date"
          value={dateTo || ''}
          onChange={(e) => updateFilter('dateTo', e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B4A]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">Country</label>
        <select
          value={country || 'ALL'}
          onChange={(e) => updateFilter('country', e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B4A]"
        >
          {COUNTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors h-fit"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}