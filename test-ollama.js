#!/usr/bin/env node

require('dotenv').config()

const models = [
  { id: 'cogito:70b', name: 'Cogito 70B', provider: 'ollama' },
  { id: 'llama3.3:latest', name: 'Llama 3.3 Latest', provider: 'ollama' },
  { id: 'deepseek-r1:70b', name: 'DeepSeek R1 70B', provider: 'ollama' },
  { id: 'mistral-large:latest', name: 'Mistral Large Latest', provider: 'ollama' },
  { id: 'hermes3:70b', name: 'Hermes 3 70B', provider: 'ollama' }
];


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
  console.log('🦙 Testing Available Ollama Models');
  console.log('==================================\n');
  
  const results = [];
  
  for (const model of models) {
    const works = await testOllamaModel(model.id, model.name);
    results.push({ ...model, works });
    console.log(''); // Empty line for readability
  }

  console.log('\n📊 SUMMARY:');
  console.log('============');
  
  const working = results.filter(r => r.works);
  const notWorking = results.filter(r => !r.works);
  
  console.log('\n✅ Available Ollama Models:');
  working.forEach(model => {
    console.log(`   • ${model.name}`);
  });
  
  if (notWorking.length > 0) {
    console.log('\n❌ Unavailable Ollama Models:');
    notWorking.forEach(model => {
      console.log(`   • ${model.name}`);
    });
  }
  
  console.log('\n🔧 Ollama Configuration Status:');
  console.log('   Ollama URL:', process.env.OLLAMA_URL || 'Using default (roo.ai.hypha.coop)');
  console.log('   Ollama Username:', process.env.OLLAMA_USERNAME ? '✅ Configured' : '❌ Not configured');
  console.log('   Ollama Password:', process.env.OLLAMA_PASSWORD ? '✅ Configured' : '❌ Not configured');
  
  if (working.length > 0) {
    console.log(`\n🎯 Recommendation: Use ${working[0]?.name} for best results`);
  } else {
    console.log('\n⚠️ No working Ollama models found. Please check your credentials.');
  }
}

testAllModels(); 