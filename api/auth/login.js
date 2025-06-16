import { serialize } from 'cookie'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true'
}

export default function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
      .setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods'])
      .setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])
      .setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials'])
      .end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body
  const correctPassword = process.env.APP_PASSWORD

  if (!correctPassword) {
    return res.status(500).json({ error: 'No password configured' })
  }

  if (password === correctPassword) {
    // Set secure session cookie
    const sessionToken = Buffer.from(JSON.stringify({
      authenticated: true,
      timestamp: Date.now(),
      password: password // Store for API key decryption
    })).toString('base64')

    const cookie = serialize('auth-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    res.setHeader('Set-Cookie', cookie)
    res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    
    return res.status(200).json({ success: true, message: 'Authenticated successfully' })
  } else {
    res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    return res.status(401).json({ error: 'Invalid password' })
  }
} 