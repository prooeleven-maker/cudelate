import crypto from 'crypto'

/**
 * Generate a random license key
 * Format: XXXX-XXXX-XXXX-XXXX where X is alphanumeric
 */
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = 4
  const segmentLength = 4

  const segmentsArray = []
  for (let i = 0; i < segments; i++) {
    let segment = ''
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segmentsArray.push(segment)
  }

  return segmentsArray.join('-')
}

/**
 * Hash a license key using SHA-256
 */
export function hashLicenseKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Verify if a provided key matches a stored hash
 */
export function verifyLicenseKey(key: string, hash: string): boolean {
  const keyHash = hashLicenseKey(key)
  return crypto.timingSafeEqual(
    Buffer.from(keyHash, 'hex'),
    Buffer.from(hash, 'hex')
  )
}