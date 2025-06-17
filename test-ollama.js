#!/usr/bin/env node

require('dotenv').config()

const models = [
  { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5', provider: 'claude' },
  { id: 'hermes3:70b', name: 'Hermes 3 70B', provider: 'ollama' }
];

async function testClaudeModel(modelId, modelName) {
  try {
    console.log(`🧪 Testing ${modelName} (${modelId})...`);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with just your model name and version.'
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const responseText = data.content?.[0]?.text || 'No response text';
      console.log(`✅ ${modelName}: ${responseText.substring(0, 100)}...`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ ${modelName}: ${response.status} - ${error.substring(0, 150)}...`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${modelName}: Network error - ${error.message}`);
    return false;
  }
}

async function testOllamaModel(modelId, modelName) {
  try {
    console.log(`🦙 Testing ${modelName} (${modelId})...`);
    
    if (!process.env.OLLAMA_USERNAME || !process.env.OLLAMA_PASSWORD) {
      console.log(`⚠️ ${modelName}: Ollama credentials not configured, skipping...`);
      return false;
    }

    const authHeader = Buffer.from(`${process.env.OLLAMA_USERNAME}:${process.env.OLLAMA_PASSWORD}`).toString('base64');
    
    const ollamaUrl = process.env.OLLAMA_URL || 'https://roo.ai.hypha.coop/api/generate'
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelId,
        prompt: 'Hello! Please respond with just your model name.',
        stream: false,
        options: {
          num_predict: 50
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const responseText = data.response || 'No response text';
      console.log(`✅ ${modelName}: ${responseText.substring(0, 100)}...`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ ${modelName}: ${response.status} - ${error.substring(0, 150)}...`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${modelName}: Network error - ${error.message}`);
    return false;
  }
}

async function testAllModels() {
  console.log('🚀 Testing Available AI Models');
  console.log('==============================\n');
  
  const results = [];
  
  for (const model of models) {
    let works = false;
    
    if (model.provider === 'claude') {
      works = await testClaudeModel(model.id, model.name);
    } else if (model.provider === 'ollama') {
      works = await testOllamaModel(model.id, model.name);
    }
    
    results.push({ ...model, works });
    console.log(''); // Empty line for readability
  }

  console.log('\n📊 SUMMARY:');
  console.log('============');
  
  const working = results.filter(r => r.works);
  const notWorking = results.filter(r => !r.works);
  
  console.log('\n✅ Available Models:');
  working.forEach(model => {
    console.log(`   • ${model.name} (${model.provider.toUpperCase()})`);
  });
  
  if (notWorking.length > 0) {
    console.log('\n❌ Unavailable Models:');
    notWorking.forEach(model => {
      console.log(`   • ${model.name} (${model.provider.toUpperCase()})`);
    });
  }
  
  console.log('\n🔧 Configuration Status:');
  console.log('   Claude API Key:', process.env.CLAUDE_API_KEY ? '✅ Configured' : '❌ Not configured');
  console.log('   Ollama URL:', process.env.OLLAMA_URL || 'Using default (roo.ai.hypha.coop)');
  console.log('   Ollama Username:', process.env.OLLAMA_USERNAME ? '✅ Configured' : '❌ Not configured');
  console.log('   Ollama Password:', process.env.OLLAMA_PASSWORD ? '✅ Configured' : '❌ Not configured');
  
  if (working.length > 0) {
    console.log(`\n🎯 Recommendation: Use ${working[0]?.name} for best results`);
  } else {
    console.log('\n⚠️ No working models found. Please check your API credentials.');
  }
}

testAllModels(); 