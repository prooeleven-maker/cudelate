import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL &&
                     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                     process.env.SUPABASE_SERVICE_ROLE_KEY

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function logError(context: string, error: any) {
  console.error(`[REGISTER ERROR] ${context}:`, error)
}

function logInfo(message: string) {
  console.log(`[REGISTER INFO] ${message}`)
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    if (!isConfigured || !supabaseAdmin) {
      logError('Configuration', 'Supabase not configured')
      return NextResponse.json(
        { success: false, error: 'Service not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { key, username, password, hwid } = body

    logInfo(`Registration attempt for username: ${username}`)

    if (!key || !username || !password || !hwid) {
      logInfo(`Missing fields - key:${!!key} username:${!!username} password:${!!password} hwid:${!!hwid}`)
      return NextResponse.json(
        { success: false, error: 'All fields are required (key, username, password, hwid)' },
        { status: 400 }
      )
    }

    if (username.length < 3 || username.length > 32) {
      logInfo(`Invalid username length: ${username.length}`)
      return NextResponse.json(
        { success: false, error: 'Username must be between 3 and 32 characters' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      logInfo('Password too short')
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const { data: existingUser } = await supabaseAdmin
      .from('license_keys')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingUser) {
      logInfo(`Username already exists: ${username}`)
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 200 }
      )
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('key_hash', key)
      .maybeSingle()

    if (keyError) {
      logError('Database query', keyError)
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      )
    }

    if (!keyData) {
      logInfo(`Invalid license key provided`)
      return NextResponse.json(
        { success: false, error: 'Invalid license key' },
        { status: 200 }
      )
    }

    if (!keyData.is_active) {
      logInfo(`Inactive license key: ${key.substring(0, 8)}...`)
      return NextResponse.json(
        { success: false, error: 'License key is inactive' },
        { status: 200 }
      )
    }

    if (keyData.expires_at) {
      const expiresAt = new Date(keyData.expires_at)
      if (expiresAt <= new Date()) {
        logInfo(`Expired license key: ${key.substring(0, 8)}...`)
        return NextResponse.json(
          { success: false, error: 'License key has expired' },
          { status: 200 }
        )
      }
    }

    if (keyData.is_registered) {
      logInfo(`License key already registered: ${key.substring(0, 8)}...`)
      return NextResponse.json(
        { success: false, error: 'License key already registered to another account' },
        { status: 200 }
      )
    }

    const passwordHash = hashPassword(password)

    const { error: updateError } = await supabaseAdmin
      .from('license_keys')
      .update({
        username: username,
        password_hash: passwordHash,
        hwid: hwid,
        is_registered: true,
        last_used_at: new Date().toISOString()
      })
      .eq('id', keyData.id)

    if (updateError) {
      logError('Update user data', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to register account' },
        { status: 500 }
      )
    }

    logInfo(`Successfully registered user: ${username}`)

    return NextResponse.json({
      success: true,
      expires_at: keyData.expires_at,
      message: 'Account registered successfully!'
    })

  } catch (error) {
    logError('Unexpected error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 })
}
