#!/usr/bin/env node

require('dotenv').config();

const models = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Latest)' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4 (Most Powerful)' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude Sonnet 3.7' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude Sonnet 3.5' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5' },
  { id: 'claude-3-opus-20240229', name: 'Claude Opus 3' },
  { id: 'claude-3-haiku-20240307', name: 'Claude Haiku 3' }
];

async function testModel(modelId, modelName) {
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

async function testAllModels() {
  console.log('🚀 Testing Available Claude Models\n');
  console.log('==========================================\n');
  
  if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ No CLAUDE_API_KEY found in environment variables');
    return;
  }

  const results = [];
  
  for (const model of models) {
    const works = await testModel(model.id, model.name);
    results.push({ ...model, works });
    console.log(''); // Empty line for readability
  }

  console.log('\n📊 SUMMARY:');
  console.log('==========================================');
  
  const working = results.filter(r => r.works);
  const notWorking = results.filter(r => !r.works);
  
  console.log('\n✅ Available Models:');
  working.forEach(model => {
    console.log(`   • ${model.name} (${model.id})`);
  });
  
  if (notWorking.length > 0) {
    console.log('\n❌ Unavailable Models:');
    notWorking.forEach(model => {
      console.log(`   • ${model.name} (${model.id})`);
    });
  }
  
  console.log(`\n🎯 Recommendation: Use ${working[0]?.name || 'Claude Sonnet 3.5'} for best results`);
}

testAllModels().catch(console.error); 