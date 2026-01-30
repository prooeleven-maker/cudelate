export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const isConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY

// ⚠️ Rate limit simples (em memória do Edge — reinicia quando o worker reinicia)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    if (!isConfigured) {
      return NextResponse.json(
        { valid: false, error: 'Service not configured' },
        { status: 503 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { valid: false, error: 'Service unavailable' },
        { status: 503 }
      )
    }

    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { valid: false, error: 'Too many requests. Try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { key } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'License key is required' },
        { status: 400 }
      )
    }

    // Espera receber o HASH exato da key
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('key_hash', key)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json(
        { valid: false, error: 'License key not found' },
        { status: 200 }
      )
    }

    if (!data.is_active) {
      return NextResponse.json(
        { valid: false, error: 'License key is inactive' },
        { status: 200 }
      )
    }

    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at)
      if (expiresAt <= new Date()) {
        return NextResponse.json(
          { valid: false, error: 'License key has expired' },
          { status: 200 }
        )
      }
    }

    // Atualiza last_used_at (não quebra se falhar)
    await supabaseAdmin
      .from('license_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)

    return NextResponse.json({
      valid: true,
      expires_at: data.expires_at,
      message: 'License key is valid',
    })
  } catch (error) {
    console.error('[VERIFY KEY ERROR]', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
