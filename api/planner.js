// api/planner.js
// API serverless: lê e grava o planner de um dia no Upstash Redis.
// Protegida implicitamente pelo middleware.js (Basic Auth) que já existe no projeto.

import { Redis } from '@upstash/redis';

// O cliente lê automaticamente KV_REST_API_URL e KV_REST_API_TOKEN
// das variáveis de ambiente injetadas pela integração Upstash <-> Vercel.
const redis = Redis.fromEnv();

// Valida formato de data: YYYY-MM-DD
function isValidDate(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

export default async function handler(req, res) {
  try {
    // ---------- GET /api/planner?date=YYYY-MM-DD ----------
    if (req.method === 'GET') {
      const { date } = req.query;

      // Se não passou data, retorna lista de todas as datas salvas
      if (!date) {
        const keys = await redis.keys('planner:*');
        const dates = keys.map(k => k.replace('planner:', '')).sort();
        return res.status(200).json({ dates });
      }

      if (!isValidDate(date)) {
        return res.status(400).json({ error: 'date deve estar em YYYY-MM-DD' });
      }

      const data = await redis.get(`planner:${date}`);
      // Se ainda não existe, devolve null (frontend trata como "dia vazio")
      return res.status(200).json({ date, data: data ?? null });
    }

    // ---------- PUT /api/planner ----------
    // Body esperado: { date: "YYYY-MM-DD", data: { ...qualquer JSON... } }
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { date, data } = body || {};

      if (!isValidDate(date)) {
        return res.status(400).json({ error: 'date inválida (use YYYY-MM-DD)' });
      }
      if (data === undefined) {
        return res.status(400).json({ error: 'campo "data" é obrigatório' });
      }

      await redis.set(`planner:${date}`, data);
      return res.status(200).json({ ok: true, date });
    }

    // ---------- DELETE /api/planner?date=YYYY-MM-DD ----------
    if (req.method === 'DELETE') {
      const { date } = req.query;
      if (!isValidDate(date)) {
        return res.status(400).json({ error: 'date inválida' });
      }
      await redis.del(`planner:${date}`);
      return res.status(200).json({ ok: true, date });
    }

    res.setHeader('Allow', 'GET, PUT, POST, DELETE');
    return res.status(405).json({ error: 'método não permitido' });
  } catch (err) {
    console.error('[api/planner] erro:', err);
    return res.status(500).json({ error: 'erro interno', detail: String(err.message || err) });
  }
}