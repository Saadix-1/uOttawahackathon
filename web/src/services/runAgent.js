// src/services/runAgent.js
const PROVIDER_MAP = {
  langgraph: '/api/langgraph',
  autogen: '/api/autogen',
  crewai: '/api/crewai',
  llamaindex: '/api/llamaindex',
}

export async function runAgent({ task, frameworkId, modelId }) {
  const start = performance.now()
  const endpoint = PROVIDER_MAP[frameworkId]
  if (!endpoint) throw new Error(`No endpoint for ${frameworkId}`)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, modelId }),
  })
  if (!res.ok) throw new Error(`Provider error: ${res.status}`)
  const data = await res.json() // expect { output, tokens, cost, quality, coverage, steps }
  const latency = +((performance.now() - start) / 1000).toFixed(1)

  return {
    output: data.output,
    steps: data.steps ?? [],
    metrics: {
      latency,
      tokens: data.tokens ?? 0,
      cost: data.cost ?? 0,
      quality: data.quality ?? 0,
      coverage: data.coverage ?? 0,
      safety: data.safety ?? 0,
    },
  }
}
