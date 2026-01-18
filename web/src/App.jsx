import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { runAgent } from './services/runAgent.js'

const frameworks = [
  {
    id: 'langgraph',
    name: 'LangGraph',
    accent: '#8ef1ff',
    description: 'Graph-first control with tool-calling and guardrails.',
    strengths: ['branch-safe', 'memory aware', 'deterministic'],
  },
  {
    id: 'autogen',
    name: 'AutoGen',
    accent: '#f5c66d',
    description: 'Conversational multi-agent orchestration with swappable runtimes.',
    strengths: ['negotiation', 'lightweight', 'multi-round'],
  },
  {
    id: 'crewai',
    name: 'CrewAI',
    accent: '#c7a0ff',
    description: 'Role-based agent crews with task decomposition and reviews.',
    strengths: ['role clarity', 'reviews', 'handoffs'],
  },
  {
    id: 'llamaindex',
    name: 'LlamaIndex',
    accent: '#7df1c3',
    description: 'Retrieval-centric agent graphs with observability hooks.',
    strengths: ['retrieval', 'evaluations', 'schema aware'],
  },
]

const models = [
  { id: 'gpt-41', name: 'GPT-4.1', vendor: 'OpenAI', costPer1k: 0.004, style: 'analysis' },
  { id: 'claude-37', name: 'Claude 3.7 Sonnet', vendor: 'Anthropic', costPer1k: 0.0035, style: 'reasoned' },
  { id: 'llama-33', name: 'Llama 3.3 70B', vendor: 'Meta', costPer1k: 0.0015, style: 'open-weight' },
  { id: 'gemini-20', name: 'Gemini 2.0 Flash', vendor: 'Google', costPer1k: 0.002, style: 'speed' },
]

const starterPrompts = [
  'Design a weekend web app that compares climate data using AI agents.',
  'Generate a launch plan for a student fintech MVP with guardrails.',
  'Map the fastest route to prototype a multimodal travel concierge.',
]

const planLibrary = [
  ['Clarify the user goal and target constraints', 'Collect context + retrieve facts/tools', 'Draft two options and score on cost, coverage, risk', 'Select the best option, then outline next actions'],
  ['Establish success metrics and failure modes', 'Call external tools for data + validation', 'Generate a candidate response', 'Self-review and tighten language'],
  ['Identify stakeholders and resources', 'Break down work into parallel agent roles', 'Simulate one round and capture deltas', 'Produce concise, decision-ready output'],
  ['Surface assumptions and missing signals', 'Probe edge cases with synthetic checks', 'Assemble the final recommendation', 'Deliver a short follow-up checklist'],
]

const outputAngles = [
  'Framed the objective and success guardrails, then aligned agent roles.',
  'Leaned on high-coverage retrieval to ground the answer and prune hallucinations.',
  'Ran a two-pass critique to stress test the proposed approach.',
  'Optimized for speed-first execution while tracking risk triggers.',
]

const closingNotes = [
  'Next move: validate critical paths with a dry-run tool call and tighten any cost outliers.',
  'Highlight: reused context across tools to cut latency without losing rigor.',
  'Risk: watch for stale data; schedule a refresh cadence before launch.',
  'Bonus: snapshot intermediate traces for quick human-in-the-loop review.',
]

const hashString = (value) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(i)
  }
  return Math.abs(hash)
}

const seededNumber = (seed, offset = 0) => {
  const x = Math.sin(seed + offset) * 10000
  return x - Math.floor(x)
}

const pick = (list, seed, offset = 0) => list[(seed + offset) % list.length]

const formatTaskSnippet = (task) => (task.length > 120 ? `${task.slice(0, 117)}...` : task)

const craftOutput = (task, seed) => {
  const opener = pick(outputAngles, seed, 1)
  const closer = pick(closingNotes, seed, 2)
  return `${opener} Focused on "${formatTaskSnippet(task)}". ${closer}`
}


const aggregateHighlights = (runs) => {
  if (!runs.length) {
    return {}
  }

  const validRuns = runs.filter(r => !r.error)
  if (!validRuns.length) return {}

  const fastest = validRuns.reduce((best, run) => (run.metrics.latency < best.metrics.latency ? run : best), validRuns[0])
  const cheapest = validRuns.reduce((best, run) => (run.metrics.cost < best.metrics.cost ? run : best), validRuns[0])
  const highestQuality = validRuns.reduce((best, run) => (run.metrics.quality > best.metrics.quality ? run : best), validRuns[0])
  const averageTokens = Math.round(validRuns.reduce((sum, run) => sum + run.metrics.tokens, 0) / validRuns.length)

  return { fastest, cheapest, highestQuality, averageTokens }
}

function App() {
  const [task, setTask] = useState(starterPrompts[0])
  const [selectedFrameworks, setSelectedFrameworks] = useState(frameworks.map((fw) => fw.id))
  const [selectedModels, setSelectedModels] = useState([models[0].id, models[1].id])
  const [runs, setRuns] = useState([])

  const buildComparisons = async (nextTask = task, nextFrameworks = selectedFrameworks, nextModels = selectedModels) => {
    const pickedFrameworks = frameworks.filter((fw) => nextFrameworks.includes(fw.id))
    const pickedModels = models.filter((m) => nextModels.includes(m.id))

    setRuns((prev) => prev.map((r) => ({ ...r, loading: true })))
    const combos = pickedFrameworks.flatMap((fw) => pickedModels.map((m) => ({ fw, m })))

    const results = await Promise.allSettled(
      combos.map(({ fw, m }) =>
        runAgent({ task: nextTask, frameworkId: fw.id, modelId: m.id }).then((res) => ({ fw, m, ...res }))
      )
    )

    setRuns(
      results.map((res, i) => {
        const { fw, m } = combos[i]
        if (res.status === 'fulfilled') return { id: `${fw.id}-${m.id}`, framework: fw, model: m, ...res.value }
        return { id: `${fw.id}-${m.id}`, framework: fw, model: m, error: res.reason?.message || 'Failed', metrics: { latency: 0, tokens: 0, cost: 0, quality: 0, coverage: 0 }, steps: [], output: 'Error' }
      })
    )
  }

  useEffect(() => {
    buildComparisons(task, selectedFrameworks, selectedModels)
  }, [task, selectedFrameworks, selectedModels])

  const highlights = useMemo(() => aggregateHighlights(runs), [runs])

  const toggleFramework = (id) => {
    setSelectedFrameworks((prev) => (prev.includes(id) ? prev.filter((fw) => fw !== id) : [...prev, id]))
  }

  const toggleModel = (id) => {
    setSelectedModels((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const readyToCompare = selectedFrameworks.length > 0 && selectedModels.length > 0 && task.trim().length > 0

  return (
    <div className="page">
      <div className="ambient"></div>
      <header className="hero">
        <div className="badge">Agentic Compare</div>
        <h1>Run the same task across frameworks, models, and strategies</h1>
        <p className="lede">
          Choose the agentic stack, fire a task, and get side-by-side outputs with latency, token, and quality signals.
          Built for quick bake-offs and decision-ready comparisons.
        </p>
      </header>

      <div className="layout">
        <aside className="panel control">
          <div className="section">
            <div className="section-header">
              <span className="section-label">Task</span>
              <span className="muted">Same prompt, multiple stacks</span>
            </div>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={5}
              placeholder="Describe the task you want every agent to run..."
            />
            <div className="chips">
              {starterPrompts.map((prompt) => (
                <button key={prompt} type="button" className="chip" onClick={() => setTask(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-label">Frameworks</span>
              <span className="muted">Pick who orchestrates</span>
            </div>
            <div className="option-grid">
              {frameworks.map((fw) => (
                <button
                  key={fw.id}
                  type="button"
                  className={`option ${selectedFrameworks.includes(fw.id) ? 'option-active' : ''}`}
                  onClick={() => toggleFramework(fw.id)}
                >
                  <span className="dot" style={{ background: fw.accent }} />
                  <div>
                    <div className="option-title">{fw.name}</div>
                    <div className="option-sub">{fw.description}</div>
                  </div>
                  <div className="pills">
                    {fw.strengths.map((s) => (
                      <span key={s} className="pill">{s}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-label">Models</span>
              <span className="muted">Swap LLM brains</span>
            </div>
            <div className="option-grid models">
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  className={`option ${selectedModels.includes(model.id) ? 'option-active' : ''}`}
                  onClick={() => toggleModel(model.id)}
                >
                  <div>
                    <div className="option-title">{model.name}</div>
                    <div className="option-sub">{model.vendor} · {model.style}</div>
                  </div>
                  <span className="pill muted">~${model.costPer1k.toFixed(3)}/1k tok</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={`cta ${readyToCompare ? '' : 'cta-disabled'}`}
            disabled={!readyToCompare}
            onClick={() => {
              console.log('Button clicked!', { task, selectedFrameworks, selectedModels })
              buildComparisons(task, selectedFrameworks, selectedModels)
            }} // debugging in console
          >
            Run comparison across {selectedFrameworks.length} framework(s) × {selectedModels.length} model(s)
          </button>
        </aside>

        <main className="panel results">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">Fastest</div>
              {highlights.fastest ? (
                <>
                  <div className="summary-value">{highlights.fastest.metrics.latency}s</div>
                  <div className="summary-sub">
                    {highlights.fastest.framework.name} · {highlights.fastest.model.name}
                  </div>
                </>
              ) : (
                <div className="summary-empty">No runs yet</div>
              )}
            </div>
            <div className="summary-card">
              <div className="summary-label">Cheapest</div>
              {highlights.cheapest ? (
                <>
                  <div className="summary-value">${highlights.cheapest.metrics.cost.toFixed(3)}</div>
                  <div className="summary-sub">
                    {highlights.cheapest.framework.name} · {highlights.cheapest.model.name}
                  </div>
                </>
              ) : (
                <div className="summary-empty">No runs yet</div>
              )}
            </div>
            <div className="summary-card">
              <div className="summary-label">Highest quality</div>
              {highlights.highestQuality ? (
                <>
                  <div className="summary-value">{highlights.highestQuality.metrics.quality}/100</div>
                  <div className="summary-sub">
                    {highlights.highestQuality.framework.name} · {highlights.highestQuality.model.name}
                  </div>
                </>
              ) : (
                <div className="summary-empty">No runs yet</div>
              )}
            </div>
            <div className="summary-card">
              <div className="summary-label">Avg tokens</div>
              {highlights.averageTokens ? (
                <>
                  <div className="summary-value">{highlights.averageTokens}</div>
                  <div className="summary-sub">per run across selections</div>
                </>
              ) : (
                <div className="summary-empty">No runs yet</div>
              )}
            </div>
          </div>

          <div className="section-header with-margin">
            <span className="section-label">Run matrix</span>
            <span className="muted">Outputs + per-agent metrics</span>
          </div>

          <div className="run-grid">
            {runs.map((run) => (
              <div key={run.id} className="run-card">
                <div className="run-head">
                  <div className="stack">
                    <span className="dot" style={{ background: run.framework.accent }} />
                    <div>
                      <div className="run-title">{run.framework.name}</div>
                      <div className="run-sub">
                        {run.model.name} · {run.model.vendor}
                      </div>
                    </div>
                  </div>
                  <span className="pill">Coverage {run.metrics.coverage}%</span>
                </div>

                <div className="metric-row">
                  <div className="metric">
                    <span className="metric-label">Latency</span>
                    <span className="metric-value">{run.metrics.latency}s</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Tokens</span>
                    <span className="metric-value">{run.metrics.tokens}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Quality</span>
                    <span className="metric-value">{run.metrics.quality}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Cost</span>
                    <span className="metric-value">${run.metrics.cost.toFixed(3)}</span>
                  </div>
                </div>

                <div className="plan">
                  {run.steps.map((step) => (
                    <div key={step} className="plan-step">
                      <span className="tick">●</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="output">
                  <div className="output-label">Observed output</div>
                  <p>{run.output}</p>
                </div>

                <div className="tags">
                  {run.framework.strengths.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                  <span className="tag light">{run.model.style}</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
