import { VercelRequest, VercelResponse } from '@vercel/node';
import { evaluateAndCreateGate, getAgentGates } from '../src/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const result = await evaluateAndCreateGate(req.body);
      if (result.approved) {
        return res.status(201).json({ success: true, data: result.gate });
      }
      return res.status(403).json({ success: false, error: result.reasons.join('. ') });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'GET') {
    const { agentId } = req.query;
    if (!agentId) return res.status(400).json({ error: 'agentId required' });
    const gates = await getAgentGates(agentId as string);
    return res.json({ success: true, data: gates, count: gates.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
