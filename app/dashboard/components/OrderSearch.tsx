'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function OrderSearch({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(defaultValue)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        placeholder="Search by order #, customer name, email, phone, or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B4A]"
      />
      <button
        type="submit"
        className="bg-[#FF6B4A] hover:bg-[#FF8566] text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Search
      </button>
      {search && (
        <button
          type="button"
          onClick={() => {
            setSearch('')
            const params = new URLSearchParams(searchParams.toString())
            params.delete('search')
            router.push(`/dashboard?${params.toString()}`)
          }}
          className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Clear
        </button>
      )}
    </form>
  )
}