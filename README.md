# AgentPay Zero Stack — H0: Hack the Zero Stack

**Serverless agent payment infrastructure. Built for Vercel v0 + AWS Databases.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## The Problem

AI agents need to pay for APIs, compute, and services. Without a governance layer, every agent has unfettered access to payment credentials — a security and compliance nightmare.

## The Solution

AgentPay Zero Stack is a fully serverless payment gateway for AI agent fleets. Deploy in minutes on Vercel + AWS DynamoDB. No servers, no ops, no secrets management.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AI Agent    │────▶│  Vercel v0 API   │────▶│  AWS DynamoDB   │
│  (any stack) │     │  (serverless)    │     │  (persistence)  │
└──────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Guardrail Engine│
                     │  • Budget limits │
                     │  • Per-tx caps   │
                     │  • Audit trail   │
                     └──────────────────┘
```

## API Endpoints (Vercel)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | `GET` | List agents |
| `/api/agents` | `POST` | Register agent |
| `/api/agents?agentId=X` | `GET` | Get agent |
| `/api/gates` | `POST` | Evaluate + create payment gate |
| `/api/gates?agentId=X` | `GET` | List agent gates |
| `/api/summary` | `GET` | System summary |

## Quick Start

```bash
# Deploy to Vercel
npx vercel deploy --prod

# Register an agent
curl -X POST https://your-app.vercel.app/api/agents \
  -H "Content-Type: application/json" \
  -d '{"agentId":"bot-1","name":"Research Bot","budget":500}'

# Create a payment gate
curl -X POST https://your-app.vercel.app/api/gates \
  -H "Content-Type: application/json" \
  -d '{"agentId":"bot-1","amount":50,"target":"https://api.openai.com/v1"}'
```

## AWS DynamoDB Tables

| Table | Key | Purpose |
|-------|-----|---------|
| `agentpay-agents` | `agentId` (PK) | Agent state + budget |
| `agentpay-gates` | `gateId` (PK), `agentId` (GSI) | Payment gates |
| `agentpay-audit` | `entryId` (PK), `agentId-timestamp` (GSI) | Immutable audit trail |

Deploy via AWS CDK or CloudFormation template (see `infra/`).

## Built For

**H0: Hack the Zero Stack** — by Amazon + Vercel v0 + AWS Databases
**Team:** AgentPay Labs
**Repository:** https://github.com/Rumblingb/agentpay-zero-stack
