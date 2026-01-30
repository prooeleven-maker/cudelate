export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL &&
                     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                     process.env.SUPABASE_SERVICE_ROLE_KEY

function logError(context: string, error: any) {
  console.error(`[LOGIN ERROR] ${context}:`, error)
}

function logInfo(message: string) {
  console.log(`[LOGIN INFO] ${message}`)
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
    const { username, password, hwid } = body

    logInfo(`Login attempt for username: ${username}`)

    if (!username || !password || !hwid) {
      logInfo(`Missing fields - username:${!!username} password:${!!password} hwid:${!!hwid}`)
      return NextResponse.json(
        { success: false, error: 'Username, password and HWID are required' },
        { status: 400 }
      )
    }

    const passwordHash = hashPassword(password)

    const { data: userData, error: userError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('username', username)
      .maybeSingle()

    if (userError) {
      logError('Database query', userError)
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      )
    }

    if (!userData) {
      logInfo(`Username not found: ${username}`)
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 200 }
      )
    }

    if (userData.password_hash !== passwordHash) {
      logInfo(`Invalid password for username: ${username}`)
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 200 }
      )
    }

    if (!userData.is_active) {
      logInfo(`Inactive account: ${username}`)
      return NextResponse.json(
        { success: false, error: 'Account is inactive. Contact support.' },
        { status: 200 }
      )
    }

    if (userData.expires_at) {
      const expiresAt = new Date(userData.expires_at)
      if (expiresAt <= new Date()) {
        logInfo(`Expired license for username: ${username}`)
        return NextResponse.json(
          { success: false, error: 'License has expired' },
          { status: 200 }
        )
      }
    }

    if (userData.hwid && userData.hwid !== hwid) {
      logInfo(`HWID mismatch for username: ${username} - Expected: ${userData.hwid.substring(0, 8)}... Got: ${hwid.substring(0, 8)}...`)
      return NextResponse.json(
        { success: false, error: 'HWID mismatch. This account is registered to another computer.' },
        { status: 200 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('license_keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        hwid: hwid
      })
      .eq('id', userData.id)

    if (updateError) {
      logError('Update last login', updateError)
    }

    logInfo(`Successful login for username: ${username}`)

    return NextResponse.json({
      success: true,
      expires_at: userData.expires_at,
      message: 'Login successful!'
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

