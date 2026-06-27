/**
 * AgentPay Zero Stack — Serverless Agent Payment Infrastructure
 * Built for H0: Hack the Zero Stack (Vercel v0 + AWS Databases)
 *
 * Architecture:
 *   Vercel v0 (API routes) → AWS DynamoDB (persistence) → AgentPay Engine
 *
 * Deployed as:
 *   - Vercel serverless functions (API endpoints)
 *   - AWS DynamoDB tables (agent state, payment gates, audit trail)
 *   - AWS Lambda (guardrail evaluation, triggered by DynamoDB streams)
 */

// ── Configuration (set via Vercel environment variables) ──
const config = {
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  agentsTable: process.env.AGENTS_TABLE || 'agentpay-agents',
  gatesTable: process.env.GATES_TABLE || 'agentpay-gates',
  auditTable: process.env.AUDIT_TABLE || 'agentpay-audit',
  defaultBudget: parseInt(process.env.DEFAULT_BUDGET || '500'),
  maxGateAmount: parseInt(process.env.MAX_GATE_AMOUNT || '100'),
};

// ── In-Memory Store (for development/quick demo) ──
// In production, this is replaced by AWS DynamoDB DocumentClient
const store = {
  agents: new Map<string, Agent>(),
  gates: new Map<string, PaymentGate>(),
  audit: new Map<string, AuditEntry>(),
};

// ── Types ──

interface Agent {
  agentId: string;
  name: string;
  owner: string;
  department: string;
  budget: number;
  spent: number;
  status: 'active' | 'suspended';
  createdAt: string;
  capabilities: string[];
}

interface PaymentGate {
  gateId: string;
  agentId: string;
  targetService: string;
  maxAmount: number;
  scope: string;
  token: string;
  expiresAt: string;
  used: number;
}

interface AuditEntry {
  entryId: string;
  timestamp: string;
  agentId: string;
  action: string;
  amount: number;
  status: 'approved' | 'denied';
  reason: string;
}

// ── Agent Operations ──

export async function registerAgent(params: {
  agentId: string;
  name: string;
  owner?: string;
  department?: string;
  budget?: number;
  capabilities?: string[];
}): Promise<Agent> {
  if (store.agents.has(params.agentId)) {
    throw new Error(`Agent ${params.agentId} already exists`);
  }

  const agent: Agent = {
    agentId: params.agentId,
    name: params.name,
    owner: params.owner || 'admin',
    department: params.department || 'general',
    budget: params.budget || config.defaultBudget,
    spent: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    capabilities: params.capabilities || [],
  };

  store.agents.set(agent.agentId, agent);

  await pushAudit({
    entryId: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentId: agent.agentId,
    action: 'agent_register',
    amount: 0,
    status: 'approved',
    reason: `Agent ${agent.name} registered with $${agent.budget} budget`,
  });

  return agent;
}

export async function getAgent(agentId: string): Promise<Agent | null> {
  return store.agents.get(agentId) || null;
}

export async function listAgents(): Promise<Agent[]> {
  return Array.from(store.agents.values());
}

// ── Payment Gate Engine ──

export async function evaluateAndCreateGate(params: {
  agentId: string;
  amount: number;
  target: string;
  scope?: string;
}): Promise<{ approved: boolean; gate?: PaymentGate; reasons: string[] }> {
  const agent = store.agents.get(params.agentId);
  const reasons: string[] = [];

  if (!agent) return { approved: false, reasons: [`Agent ${params.agentId} not found`] };
  if (agent.status !== 'active') return { approved: false, reasons: [`Agent is ${agent.status}`] };

  // Budget guardrail
  if (agent.spent + params.amount > agent.budget) {
    reasons.push(`Budget guardrail: $${agent.budget} limit, $${agent.spent + params.amount} would be used`);
  }

  // Per-transaction limit
  if (params.amount > config.maxGateAmount) {
    reasons.push(`Transaction guardrail: $${params.amount} exceeds max $${config.maxGateAmount} per gate`);
  }

  if (reasons.length > 0) {
    await pushAudit({
      entryId: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      agentId: params.agentId,
      action: 'payment_denied',
      amount: params.amount,
      status: 'denied',
      reason: reasons.join('; '),
    });
    return { approved: false, reasons };
  }

  // Create gate
  const gateId = `gate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const gate: PaymentGate = {
    gateId,
    agentId: params.agentId,
    targetService: params.target,
    maxAmount: params.amount,
    scope: params.scope || 'payments',
    token: `apg_${Buffer.from(gateId).toString('base64').replace(/=/g, '').slice(0, 24)}`,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    used: 0,
  };

  store.gates.set(gate.gateId, gate);
  agent.spent += params.amount;

  await pushAudit({
    entryId: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentId: params.agentId,
    action: 'gate_created',
    amount: params.amount,
    status: 'approved',
    reason: `Gate ${gateId}: $${params.amount} for ${params.target}`,
  });

  return { approved: true, gate, reasons: [] };
}

export async function getAgentGates(agentId: string): Promise<PaymentGate[]> {
  return Array.from(store.gates.values()).filter(g => g.agentId === agentId);
}

// ── Audit Trail ──

async function pushAudit(entry: AuditEntry): Promise<void> {
  store.audit.set(entry.entryId, entry);
}

export async function getAuditLog(filter?: {
  agentId?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  let entries = Array.from(store.audit.values());
  if (filter?.agentId) {
    entries = entries.filter(e => e.agentId === filter.agentId);
  }
  return entries
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, filter?.limit || 50);
}

export async function getSummary(): Promise<{
  totalAgents: number;
  activeGates: number;
  totalBudget: number;
  totalSpent: number;
  totalAuditEntries: number;
}> {
  const agents = Array.from(store.agents.values());
  const gates = Array.from(store.gates.values());
  return {
    totalAgents: agents.length,
    activeGates: gates.filter(g => new Date(g.expiresAt) > new Date()).length,
    totalBudget: agents.reduce((s, a) => s + a.budget, 0),
    totalSpent: agents.reduce((s, a) => s + a.spent, 0),
    totalAuditEntries: store.audit.size,
  };
}
