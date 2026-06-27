import { VercelRequest, VercelResponse } from '@vercel/node';
import { registerAgent, getAgent, listAgents } from '../src/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const agent = await registerAgent(req.body);
      return res.status(201).json({ success: true, data: agent });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'GET') {
    const { agentId } = req.query;
    if (agentId) {
      const agent = await getAgent(agentId as string);
      if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
      return res.json({ success: true, data: agent });
    }
    const agents = await listAgents();
    return res.json({ success: true, data: agents, count: agents.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
