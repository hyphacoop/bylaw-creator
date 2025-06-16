const crypto = require('crypto')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function encryptApiKey(apiKey, password) {
  const key = crypto.scryptSync(password, 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

function decryptApiKey(encryptedKey, password) {
  try {
    const parts = encryptedKey.split(':')
    if (parts.length !== 3) return null
    
    const key = crypto.scryptSync(password, 'salt', 32)
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    return null
  }
}

console.log('🔐 Claude API Key Encryption Utility')
console.log('=====================================')

rl.question('Enter your Claude API key: ', (apiKey) => {
  rl.question('Enter encryption password: ', (password) => {
    const encrypted = encryptApiKey(apiKey, password)
    
    console.log('\n✅ Encryption successful!')
    console.log('\nAdd these to your .env file:')
    console.log(`CLAUDE_API_KEY_ENCRYPTED=${encrypted}`)
    console.log(`APP_PASSWORD=${password}`)
    console.log('\nRemove or comment out the original CLAUDE_API_KEY line.')
    
    // Test decryption
    const decrypted = decryptApiKey(encrypted, password)
    if (decrypted === apiKey) {
      console.log('\n✅ Decryption test passed!')
    } else {
      console.log('\n❌ Decryption test failed!')
    }
    
    rl.close()
  })
}) 