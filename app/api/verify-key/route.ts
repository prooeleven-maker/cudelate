import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Check if environment variables are configured
const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL &&
                     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                     process.env.SUPABASE_SERVICE_ROLE_KEY

// Rate limiting (simple in-memory store)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute per IP

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
    const supabaseAdmin = getSupabaseAdmin()

    // Check if Supabase is configured
    if (!isConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { valid: false, error: 'Service not configured. Please check environment variables.' },
        { status: 503 }
      )
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { key } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'License key is required' },
        { status: 400 }
      )
    }

    // Aqui esperamos que o cliente envie diretamente o hash exato (key_hash)
    // Ex: 3c3f9c2d...

    // Search for the key in database usando o hash enviado
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('key_hash', key)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { valid: false, error: 'License key not found' },
        { status: 200 }
      )
    }

    // Check if key is active
    if (!data.is_active) {
      return NextResponse.json(
        { valid: false, error: 'License key is inactive' },
        { status: 200 }
      )
    }

    // Check if key is expired
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at)
      const now = new Date()

      if (expiresAt <= now) {
        return NextResponse.json(
          { valid: false, error: 'License key has expired' },
          { status: 200 }
        )
      }
    }

    // Key is valid! Update last_used_at
    const { error: updateError } = await supabaseAdmin
      .from('license_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)

    if (updateError) {
      console.error('Error updating last_used_at:', updateError)
      // Don't fail the request if this update fails
    }

    return NextResponse.json({
      valid: true,
      expires_at: data.expires_at,
      message: 'License key is valid'
    })

  } catch (error) {
    console.error('Error validating license key:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}