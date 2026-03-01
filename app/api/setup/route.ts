import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
})

// This endpoint creates the initial admin user
// Should be disabled after first setup
export async function POST(req: Request) {
  // Check if any users exist
  const userCount = await prisma.user.count()
  
  if (userCount > 0) {
    return NextResponse.json(
      { error: 'Setup already completed' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const parsed = setupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400 }
    )
  }

  const { email, password, name } = parsed.data

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
    },
  })

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
}
