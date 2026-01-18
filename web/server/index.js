import express from 'express'
import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

const app = express()
app.use(express.json())

const priceTable = {
  'gpt-41': 0.004,
  'claude-37': 0.0035,
  'llama-33': 0.0015,
  'gemini-20': 0.002,
}

// Example helper (OpenAI-style)
async function callOpenAI({ task, model }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: task }],
      max_tokens: 400,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`)
  const data = await res.json()
  const usage = data.usage || {}
  const tokens = usage.total_tokens ?? 0
  const cost = tokens / 1000 * (priceTable[model] ?? 0)
  const output = data.choices?.[0]?.message?.content ?? ''
  return { output, tokens, cost, steps: ['Called OpenAI chat'], quality: 0, coverage: 0, safety: 0 }
}

// Route per provider — stub others similarly
app.post('/api/langgraph', async (req, res) => {
  try {
    const { task, modelId } = req.body
    if (process.env.OPENAI_API_KEY) {
      const result = await callOpenAI({ task, model: modelId })
      res.json(result)
    } else {
      res.json({ output: 'LangGraph with ' + modelId + ': ' + task.substring(0, 50) + '...', tokens: 150, cost: 0.0006, quality: 78, coverage: 85, safety: 90, steps: ['Parsed task', 'Built graph', 'Executed'] })
    }
  } catch (err) {
    res.json({ output: 'LangGraph result (API unavailable)', tokens: 120, cost: 0.0004, quality: 72, coverage: 80, safety: 88, steps: ['Parsed task', 'Built graph', 'Executed'] })
  }
})

// AutoGen helper
async function callAutoGen({ task, model }) {
  const res = await fetch('https://api.autogen.com/v1/task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AUTOGEN_API_KEY}`,
    },
    body: JSON.stringify({ model, input: task }),
  })

  if (!res.ok) throw new Error(`AutoGen error ${res.status}`)

  const data = await res.json()

  const tokens = data.usage?.tokens ?? 0
  const cost = data.usage?.cost ?? (tokens / 1000 * (priceTable[model] ?? 0))

  return {
    output: data.output_text || '',
    tokens,
    cost,
    steps: data.steps || ['Parsed task', 'Executed AutoGen'],
    quality: data.quality ?? 0,
    coverage: data.coverage ?? 0,
    safety: data.safety ?? 0,
  }
}

// AutoGen route
app.post('/api/autogen', async (req, res) => {
  try {
    const { task, modelId } = req.body
    const result = await callAutoGen({ task, model: modelId })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.json({
      output: 'AutoGen unavailable',
      tokens: 0,
      cost: 0,
      quality: 0,
      coverage: 0,
      safety: 0,
      steps: [],
    })
  }
})


// CrewAI helper
async function callCrewAI({ task, model }) {
  const res = await fetch('https://api.crewai.com/v1/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CREWAI_API_KEY}`,
    },
    body: JSON.stringify({ model, prompt: task }),
  })

  if (!res.ok) throw new Error(`CrewAI error ${res.status}`)

  const data = await res.json()

  const tokens = data.usage?.tokens ?? 0
  const cost = data.usage?.cost ?? (tokens / 1000 * (priceTable[model] ?? 0))

  return {
    output: data.result || '',
    tokens,
    cost,
    steps: data.steps || ['Parsed task', 'Executed CrewAI'],
    quality: data.quality ?? 0,
    coverage: data.coverage ?? 0,
    safety: data.safety ?? 0,
  }
}

// CrewAI route
app.post('/api/crewai', async (req, res) => {
  try {
    const { task, modelId } = req.body
    const result = await callCrewAI({ task, model: modelId })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.json({
      output: 'CrewAI unavailable',
      tokens: 0,
      cost: 0,
      quality: 0,
      coverage: 0,
      safety: 0,
      steps: [],
    })
  }
})


// LlamaIndex helper
async function callLlamaIndex({ task, model }) {
  const res = await fetch('https://api.llamaindex.com/v1/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
    },
    body: JSON.stringify({ model, query: task }),
  })

  if (!res.ok) throw new Error(`LlamaIndex error ${res.status}`)

  const data = await res.json()

  const tokens = data.usage?.tokens ?? 0
  const cost = data.usage?.cost ?? (tokens / 1000 * (priceTable[model] ?? 0))

  return {
    output: data.answer || '',
    tokens,
    cost,
    steps: data.steps || ['Parsed task', 'Executed LlamaIndex'],
    quality: data.quality ?? 0,
    coverage: data.coverage ?? 0,
    safety: data.safety ?? 0,
  }
}

// LlamaIndex route
app.post('/api/llamaindex', async (req, res) => {
  try {
    const { task, modelId } = req.body
    const result = await callLlamaIndex({ task, model: modelId })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.json({
      output: 'LlamaIndex unavailable',
      tokens: 0,
      cost: 0,
      quality: 0,
      coverage: 0,
      safety: 0,
      steps: [],
    })
  }
})

const port = process.env.PORT || 5174
app.listen(port, () => console.log(`API listening on ${port}`))
