'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        router.push('/login?error=invalid')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('[LOGIN_ERROR]', error)
      router.push('/login?error=server')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#141414] rounded-xl shadow-2xl border border-[#2A2A2A]">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/krak-logo.jpg"
              alt="Krak"
              width={200}
              height={60}
              className="rounded-lg"
              priority
            />
          </div>
          
          <h2 className="text-center text-2xl font-bold text-white">
            Order Management Tool
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to manage orders and deliveries
          </p>
          
          {error && (
            <p className="mt-2 text-center text-sm text-red-400">
              {error === 'invalid' ? 'Invalid email or password' : 'Server error. Please try again.'}
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-3 bg-[#1A1A1A] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-3 bg-[#1A1A1A] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-[#0A0A0A] bg-[#FF6B4A] hover:bg-[#FF8566] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B4A] focus:ring-offset-[#0A0A0A] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}