import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    
    try {
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      
      console.log('[LOGIN_ATTEMPT]', { email: email?.slice(0, 3) + '***' })
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      console.log('[LOGIN_RESULT]', { error: result?.error, ok: result?.ok })
      
      if (result?.error) {
        redirect('/login?error=invalid')
      }
      
      redirect('/dashboard')
    } catch (error: any) {
      console.error('[LOGIN_ERROR]', error.message)
      redirect('/login?error=server')
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
        </div>
        
        <form action={handleSubmit} className="mt-8 space-y-6">
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
                className="mt-1 block w-full px-3 py-3 bg-[#1A1A1A] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-[#0A0A0A] bg-[#FF6B4A] hover:bg-[#FF8566] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B4A] focus:ring-offset-[#0A0A0A] transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
