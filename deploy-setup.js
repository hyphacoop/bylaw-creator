#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Bylaw Creator - Secure Deployment Setup');
console.log('=========================================\n');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function generateSecureSecret() {
  return crypto.randomBytes(32).toString('hex');
}

async function main() {
  try {
    console.log('This script will help you prepare your application for secure deployment.\n');

    // Check if .env already exists
    if (fs.existsSync('.env')) {
      const overwrite = await askQuestion('.env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        rl.close();
        return;
      }
    }

    console.log('1. Setting up environment configuration...\n');

    // Get deployment type
    const deployType = await askQuestion('Deployment type?\n  1) Development\n  2) Production\nChoice (1-2): ');
    const isProduction = deployType === '2';

    // Get Claude API key
    const apiKey = await askQuestion('Enter your Claude API key: ');
    if (!apiKey.trim()) {
      console.error('❌ API key is required!');
      rl.close();
      return;
    }

    // Get security preferences
    const useEncryption = await askQuestion('Encrypt API key? (Y/n): ');
    const shouldEncrypt = useEncryption.toLowerCase() !== 'n';

    let envContent = '';

    if (shouldEncrypt) {
      const password = await askQuestion('Enter password for encryption (will also be app password): ');
      if (!password.trim() || password.length < 8) {
        console.error('❌ Password must be at least 8 characters!');
        rl.close();
        return;
      }

      // Encrypt the API key
      const key = crypto.scryptSync(password, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv);
      let encrypted = cipher.update(apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      encrypted = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

      envContent = `# Encrypted Configuration
CLAUDE_API_KEY_ENCRYPTED=${encrypted}
APP_PASSWORD=${password}
`;
    } else {
      const appPassword = await askQuestion('Enter app access password: ');
      if (!appPassword.trim() || appPassword.length < 8) {
        console.error('❌ Password must be at least 8 characters!');
        rl.close();
        return;
      }

      envContent = `# Basic Configuration
CLAUDE_API_KEY=${apiKey}
APP_PASSWORD=${appPassword}
`;
    }

    // Add common configuration
    const sessionSecret = generateSecureSecret();
    envContent += `SESSION_SECRET=${sessionSecret}
REACT_APP_CLAUDE_MODEL=claude-3-5-sonnet-20241022
`;

    if (isProduction) {
      const frontendUrl = await askQuestion('Frontend URL (e.g., https://yourapp.netlify.app): ');
      const backendUrl = await askQuestion('Backend URL (e.g., https://yourapi.herokuapp.com): ');
      
      envContent += `
# Production URLs
FRONTEND_URL=${frontendUrl}
REACT_APP_API_URL=${backendUrl}
NODE_ENV=production
PORT=4000
`;
    } else {
      envContent += `
# Development URLs
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:4000
NODE_ENV=development
PORT=4000
`;
    }

    // Write .env file
    fs.writeFileSync('.env', envContent);

    console.log('\n✅ Environment configuration created!');
    console.log('📁 File: .env\n');

    if (isProduction) {
      console.log('🔒 SECURITY REMINDERS FOR PRODUCTION:');
      console.log('   • Never commit .env to git');
      console.log('   • Use HTTPS for both frontend and backend');
      console.log('   • Set environment variables in your hosting platform');
      console.log('   • Test the password protection before going live\n');
      
      console.log('📋 DEPLOYMENT STEPS:');
      console.log('   1. Build frontend: npm run build');
      console.log('   2. Deploy backend with proxy-server.js');
      console.log('   3. Deploy frontend build/ folder');
      console.log('   4. Set environment variables on hosting platforms');
      console.log('   5. Test the full deployment\n');
    }

    console.log('🎉 Setup complete! Run "npm run dev" to start development.');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

main(); 