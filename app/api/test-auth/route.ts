import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('[TEST_AUTH] Checking user:', email)
    
    const user = await prisma.users.findUnique({
      where: { email },
    })
    
    if (!user) {
      console.log('[TEST_AUTH] User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('[TEST_AUTH] User found:', user.email)
    console.log('[TEST_AUTH] isActive:', user.isActive)
    console.log('[TEST_AUTH] Password hash:', user.password?.substring(0, 30))
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log('[TEST_AUTH] Password valid:', isValid)
    
    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      passwordValid: isValid,
    })
  } catch (error) {
    console.error('[TEST_AUTH_ERROR]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}