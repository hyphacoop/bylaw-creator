#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Vercel Deployment Setup - Bylaw Creator');
console.log('==========================================\n');

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
    console.log('This script will help you deploy to Vercel with proper security.\n');

    // Get Claude API key
    const apiKey = await askQuestion('Enter your Claude API key: ');
    if (!apiKey.trim()) {
      console.error('❌ API key is required!');
      rl.close();
      return;
    }
    
    // Get Ollama configuration (optional)
    const useOllama = await askQuestion('Do you want to configure Ollama API? (y/N): ');
    let ollamaUsername = '';
    let ollamaToken = '';
    
    if (useOllama.toLowerCase() === 'y' || useOllama.toLowerCase() === 'yes') {
      const ollamaUrl = await askQuestion('Enter Ollama API URL (or press Enter for default): ');
      ollamaUsername = await askQuestion('Enter Ollama username (e.g., "roo"): ');
      ollamaToken = await askQuestion('Enter Ollama token: ');
      
      process.env.OLLAMA_URL = ollamaUrl.trim() || 'https://roo.ai.hypha.coop/api/generate';
    }

    // Get security preferences
    const useEncryption = await askQuestion('Encrypt API key for extra security? (Y/n): ');
    const shouldEncrypt = useEncryption.toLowerCase() !== 'n';

    const password = await askQuestion('Enter app access password (min 8 chars): ');
    if (!password.trim() || password.length < 8) {
      console.error('❌ Password must be at least 8 characters!');
      rl.close();
      return;
    }

    console.log('\n📋 VERCEL DEPLOYMENT STEPS:');
    console.log('=============================\n');

    console.log('1. Install Vercel CLI (if not already installed):');
    console.log('   npm i -g vercel\n');

    console.log('2. Login to Vercel:');
    console.log('   vercel login\n');

    console.log('3. Deploy your project:');
    console.log('   vercel\n');

    console.log('4. Set environment variables in Vercel:');

    if (shouldEncrypt) {
      // Encrypt the API key
      const key = crypto.scryptSync(password, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv);
      let encrypted = cipher.update(apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      encrypted = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

      console.log('   vercel env add APP_PASSWORD');
      console.log(`   (Enter: ${password})`);
      console.log('   vercel env add CLAUDE_API_KEY_ENCRYPTED');
      console.log(`   (Enter: ${encrypted})`);
      
      if (ollamaToken) {
        const ollamaKey = crypto.scryptSync(password, 'salt', 32);
        const ollamaIv = crypto.randomBytes(16);
        const ollamaCipher = crypto.createCipherGCM('aes-256-gcm', ollamaKey, ollamaIv);
        let ollamaEncrypted = ollamaCipher.update(ollamaToken, 'utf8', 'hex');
        ollamaEncrypted += ollamaCipher.final('hex');
        const ollamaAuthTag = ollamaCipher.getAuthTag();
        ollamaEncrypted = ollamaIv.toString('hex') + ':' + ollamaAuthTag.toString('hex') + ':' + ollamaEncrypted;

        console.log('   vercel env add OLLAMA_URL');
        console.log(`   (Enter: ${process.env.OLLAMA_URL})`);
        console.log('   vercel env add OLLAMA_USERNAME');
        console.log(`   (Enter: ${ollamaUsername})`);
        console.log('   vercel env add OLLAMA_PASSWORD_ENCRYPTED');
        console.log(`   (Enter: ${ollamaEncrypted})`);
      }
    } else {
      console.log('   vercel env add APP_PASSWORD');
      console.log(`   (Enter: ${password})`);
      console.log('   vercel env add CLAUDE_API_KEY');
      console.log(`   (Enter: ${apiKey})`);
      
      if (ollamaToken) {
        console.log('   vercel env add OLLAMA_URL');
        console.log(`   (Enter: ${process.env.OLLAMA_URL})`);
        console.log('   vercel env add OLLAMA_USERNAME');
        console.log(`   (Enter: ${ollamaUsername})`);
        console.log('   vercel env add OLLAMA_PASSWORD');
        console.log(`   (Enter: ${ollamaToken})`);
      }
    }

    console.log('   vercel env add FRONTEND_URL');
    console.log('   (Enter your Vercel domain, e.g., https://your-app.vercel.app)\n');

    console.log('5. Redeploy after setting environment variables:');
    console.log('   vercel --prod\n');

    console.log('🔒 SECURITY FEATURES INCLUDED:');
    console.log('   ✅ Password-protected access');
    console.log('   ✅ Session-based authentication');
    console.log('   ✅ API key encryption (optional)');
    console.log('   ✅ HTTPS-only cookies in production');
    console.log('   ✅ CORS protection\n');

    console.log('📁 WHAT GETS DEPLOYED:');
    console.log('   • React frontend (static)');
    console.log('   • Serverless API functions');
    console.log('   • All in one Vercel deployment\n');

    const createLocalEnv = await askQuestion('Create local .env for development? (Y/n): ');
    if (createLocalEnv.toLowerCase() !== 'n') {
      let envContent = '';
      
      if (shouldEncrypt) {
        const key = crypto.scryptSync(password, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv);
        let encrypted = cipher.update(apiKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        encrypted = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

        let ollamaConfig = '';
        if (ollamaToken) {
          const ollamaKey = crypto.scryptSync(password, 'salt', 32);
          const ollamaIv = crypto.randomBytes(16);
          const ollamaCipher = crypto.createCipherGCM('aes-256-gcm', ollamaKey, ollamaIv);
          let ollamaEncrypted = ollamaCipher.update(ollamaToken, 'utf8', 'hex');
          ollamaEncrypted += ollamaCipher.final('hex');
          const ollamaAuthTag = ollamaCipher.getAuthTag();
          ollamaEncrypted = ollamaIv.toString('hex') + ':' + ollamaAuthTag.toString('hex') + ':' + ollamaEncrypted;
          
          ollamaConfig = `OLLAMA_URL=${process.env.OLLAMA_URL}
OLLAMA_USERNAME=${ollamaUsername}
OLLAMA_PASSWORD_ENCRYPTED=${ollamaEncrypted}
`;
        }

        envContent = `# Development Environment (Vercel + Express hybrid)
CLAUDE_API_KEY_ENCRYPTED=${encrypted}
${ollamaConfig}APP_PASSWORD=${password}
`;
      } else {
        let ollamaConfig = '';
        if (ollamaToken) {
          ollamaConfig = `OLLAMA_URL=${process.env.OLLAMA_URL}
OLLAMA_USERNAME=${ollamaUsername}
OLLAMA_PASSWORD=${ollamaToken}
`;
        }

        envContent = `# Development Environment (Vercel + Express hybrid)
CLAUDE_API_KEY=${apiKey}
${ollamaConfig}APP_PASSWORD=${password}
`;
      }

      envContent += `REACT_APP_CLAUDE_MODEL=claude-3-5-sonnet-20241022
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:4000
NODE_ENV=development
`;

      fs.writeFileSync('.env', envContent);
      console.log('✅ .env file created for local development');
    }

    console.log('\n🎉 Ready for Vercel deployment!');
    console.log('   Run: vercel');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

main(); 