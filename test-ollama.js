#!/usr/bin/env node
// Checks that the configured Ollama API is reachable and can generate text.
// Usage: npm run test-ollama -- [model ...]   (defaults to qwen3.5:9b)
const config = require('./server/lib/config')
const ollama = require('./server/lib/ollama')

const models = process.argv.slice(2)
if (models.length === 0) models.push('qwen3.5:9b')

async function main() {
  console.log(`🦙 Ollama endpoint: ${ollama.generateUrl()}`)
  console.log(`   Basic auth: ${config.ollamaUsername ? 'yes' : 'no'} | think: ${config.ollamaThink} | num_predict: ${config.ollamaNumPredict}\n`)

  let failures = 0
  for (const model of models) {
    const start = Date.now()
    try {
      const { text } = await ollama.generate({ model, prompt: 'Reply with the single word: ready', maxTokens: 50 })
      console.log(`✅ ${model}: ${Date.now() - start}ms - ${text.trim().slice(0, 80)}`)
    } catch (error) {
      failures++
      console.log(`❌ ${model}: ${error.message}`)
    }
  }
  process.exit(failures ? 1 : 0)
}

main()
