#  Multi-Agent AI Evaluation API

**uOttahack 8 – Hackathon Project**

A unified backend API for evaluating and comparing multiple AI agent frameworks (LangGraph, AutoGen, CrewAI, LlamaIndex) through a single, consistent interface.

Built for rapid experimentation, cost-awareness, and qualitative comparison of LLM-powered workflows.

---

## What This Project Does

This project exposes a **Node.js + Express API** that:

* Accepts a task prompt
* Routes it to different AI agent frameworks
* Returns a **standardized evaluation response**, including:

  * Model output
  * Token usage
  * Estimated cost
  * Quality, coverage, and safety scores
  * Execution steps

If external API keys are missing, the system **automatically falls back to mock responses**, making it ideal for hackathon demos.

---

##  Architecture Overview

```
Client (Frontend / Postman)
        |
        v
Express API (Node.js)
        |
        ├── /api/langgraph
        ├── /api/autogen
        ├── /api/crewai
        └── /api/llamaindex
```

Each endpoint accepts the same input format and returns normalized results for easy comparison.

---

##  Tech Stack

* **Node.js** 
* **Express.js**
* **dotenv** for environment variables
* **node-fetch**
* Mock-first API design for offline demos

---

##  Project Structure

```
UOttahack8/
├─ server/ (or root server file)
│  └─ index.js / server.js
├─ node_modules/
├─ package.json
├─ package-lock.json
└─ README.md
```

> Note: Depending on extraction, the backend may live inside a nested `UOttahack8/` directory.

---

##  Setup & Installation

###  Install dependencies

```bash
npm install
```

---

###  Environment variables (optional)

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your_key_here
AUTOGEN_API_KEY=your_key_here
CREWAI_API_KEY=your_key_here
LLAMAINDEX_API_KEY=your_key_here
PORT=5174
```

If no keys are provided, mock responses are used automatically.

---

###  Run the server

```bash
node server.js
```

or

```bash
node server/index.js
```

Expected output:

```
API listening on 5174
```

---
## Demo
<img width="1512" height="828" alt="Screenshot 2026-01-18 at 18 59 40" src="https://github.com/user-attachments/assets/13fcc8b3-394a-40d1-88ca-62af9ef80ae3" />
<img width="1512" height="828" alt="Screenshot 2026-01-18 at 18 59 49" src="https://github.com/user-attachments/assets/803c3e47-1c67-456c-ac50-ffd9eb0a5623" />


##  API Endpoints

### POST `/api/langgraph`

### POST `/api/autogen`

### POST `/api/crewai`

### POST `/api/llamaindex`

---

### Request Body

```json
{
  "task": "Explain how transformers work",
  "modelId": "gpt-41"
}
```

---

### Response Format

```json
{
  "output": "Generated response...",
  "tokens": 150,
  "cost": 0.0006,
  "quality": 78,
  "coverage": 85,
  "safety": 90,
  "steps": ["Parsed task", "Executed agent"]
}
```

---

##  Example Test (PowerShell)

```powershell
curl -X POST http://localhost:5174/api/langgraph `
  -H "Content-Type: application/json" `
  -Body '{ "task": "Summarize AI agents", "modelId": "gpt-41" }'
```

---

##  Hackathon Value Proposition

*  Compare multiple AI agent frameworks side-by-side
*  Estimate inference cost per task
*  Mock-friendly for offline demos
*  Clean abstraction for adding new providers
*  Plug-and-play backend for any frontend

---

##  Use Cases

* AI benchmarking dashboards
* Agent framework evaluation
* Cost-aware LLM orchestration
* Research & experimentation tools

---

##  Team

Built for **uOttahack 8**
By a team exploring the future of AI agents 🤖
