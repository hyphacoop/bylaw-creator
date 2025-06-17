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
      return { works: false, responseTime: null, accuracy: false };
    }

    const authHeader = Buffer.from(`${process.env.OLLAMA_USERNAME}:${process.env.OLLAMA_PASSWORD}`).toString('base64');
    
    const ollamaUrl = process.env.OLLAMA_URL || 'https://roo.ai.hypha.coop/api/generate'
    
    // Start timing
    const startTime = Date.now();
    
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

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      const responseText = data.response || 'No response text';
      
      // Check accuracy: does the response contain the model name?
      const expectedNames = extractModelNames(modelId);
      const accuracy = checkAccuracy(responseText.toLowerCase(), expectedNames);
      
      const accuracyIcon = accuracy ? '🎯' : '❌';
      console.log(`✅ ${modelName}: ${responseTime}ms ${accuracyIcon} ${responseText.substring(0, 80)}...`);
      
      return { works: true, responseTime, accuracy, response: responseText };
    } else {
      const error = await response.text();
      console.log(`❌ ${modelName}: ${response.status} - ${error.substring(0, 150)}...`);
      return { works: false, responseTime: null, accuracy: false };
    }
  } catch (error) {
    console.log(`❌ ${modelName}: Network error - ${error.message}`);
    return { works: false, responseTime: null, accuracy: false };
  }
}

function extractModelNames(modelId) {
  // Extract expected name variations from model ID
  const names = [];
  
  if (modelId.includes('cogito')) names.push('cogito');
  if (modelId.includes('llama')) names.push('llama');
  if (modelId.includes('deepseek')) names.push('deepseek');
  if (modelId.includes('mistral')) names.push('mistral');
  if (modelId.includes('hermes')) names.push('hermes');
  
  return names;
}

function checkAccuracy(responseText, expectedNames) {
  return expectedNames.some(name => responseText.includes(name));
}

async function testAllModels() {
  console.log('🦙 Testing Available Ollama Models');
  console.log('==================================\n');
  
  const results = [];
  
  for (const model of models) {
    const result = await testOllamaModel(model.id, model.name);
    results.push({ ...model, ...result });
    console.log(''); // Empty line for readability
  }

  console.log('\n📊 PERFORMANCE SUMMARY:');
  console.log('========================');
  
  const working = results.filter(r => r.works);
  const notWorking = results.filter(r => !r.works);
  
  if (working.length > 0) {
    console.log('\n✅ Available Ollama Models:');
    
    // Sort by response time (fastest first)
    const sortedBySpeed = [...working].sort((a, b) => a.responseTime - b.responseTime);
    
    sortedBySpeed.forEach((model, index) => {
      const rank = index + 1;
      const speedIcon = rank === 1 ? '🚀' : rank === 2 ? '⚡' : rank === 3 ? '🏃' : '🐌';
      const accuracyIcon = model.accuracy ? '🎯' : '❌';
      console.log(`   ${speedIcon} ${model.name}: ${model.responseTime}ms ${accuracyIcon}`);
    });
    
    console.log('\n🏆 RECOMMENDATIONS:');
    console.log('===================');
    
    // Find fastest accurate model
    const accurateModels = working.filter(m => m.accuracy);
    const fastestAccurate = accurateModels.length > 0 
      ? accurateModels.sort((a, b) => a.responseTime - b.responseTime)[0]
      : null;
    
    // Find fastest overall
    const fastest = sortedBySpeed[0];
    
    if (fastestAccurate) {
      console.log(`🎯 Best Overall: ${fastestAccurate.name} (${fastestAccurate.responseTime}ms, accurate)`);
    }
    
    if (fastest && (!fastestAccurate || fastest.id !== fastestAccurate.id)) {
      console.log(`🚀 Fastest: ${fastest.name} (${fastest.responseTime}ms${fastest.accuracy ? ', accurate' : ', inaccurate'})`);
    }
    
    // Show accuracy stats
    const accurateCount = working.filter(m => m.accuracy).length;
    console.log(`\n📈 Accuracy: ${accurateCount}/${working.length} models correctly identified themselves`);
    console.log(`⚡ Speed: Ranging from ${fastest.responseTime}ms to ${sortedBySpeed[sortedBySpeed.length-1].responseTime}ms`);
  }
  
  if (notWorking.length > 0) {
    console.log('\n❌ Unavailable Ollama Models:');
    notWorking.forEach(model => {
      console.log(`   • ${model.name}`);
    });
  }
  
  if (working.length === 0) {
    console.log('\n⚠️ No working Ollama models found. Please check your credentials.');
  }
  
  console.log('\n🔧 Ollama Configuration Status:');
  console.log('   Ollama URL:', process.env.OLLAMA_URL || 'Using default (roo.ai.hypha.coop)');
  console.log('   Ollama Username:', process.env.OLLAMA_USERNAME ? '✅ Configured' : '❌ Not configured');
  console.log('   Ollama Password:', process.env.OLLAMA_PASSWORD ? '✅ Configured' : '❌ Not configured');
}

testAllModels(); 