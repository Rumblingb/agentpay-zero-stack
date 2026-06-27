import { VercelRequest, VercelResponse } from '@vercel/node';
import { evaluateAndCreateGate, getAuditLog, getSummary } from '../src/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const summary = await getSummary();
    return res.json({ success: true, data: summary });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
