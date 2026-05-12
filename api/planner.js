// api/planner.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function isValidDate(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function getKey({ date, scope }) {
  if (scope === 'legacy') return 'planner:legacy';
  if (scope === 'weekly') return 'planner:weekly';

  if (!isValidDate(date)) {
    throw new Error('date inválida. Use YYYY-MM-DD ou scope=legacy/weekly');
  }

  return `planner:${date}`;
}

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method === 'GET') {
      const { date, scope } = req.query;

      if (!date && !scope) {
        const keys = await redis.keys('planner:*');

        return res.status(200).json({
          ok: true,
          keys,
        });
      }

      const key = getKey({ date, scope });
      const data = await redis.get(key);

      return res.status(200).json({
        ok: true,
        key,
        date: date || null,
        scope: scope || 'daily',
        data: data ?? null,
      });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { date, scope, data } = body || {};

      if (data === undefined) {
        return res.status(400).json({
          ok: false,
          error: 'campo "data" é obrigatório',
        });
      }

      const key = getKey({ date, scope });

      await redis.set(key, data);

      return res.status(200).json({
        ok: true,
        key,
        date: date || null,
        scope: scope || 'daily',
      });
    }

    if (req.method === 'DELETE') {
      const { date, scope } = req.query;

      const key = getKey({ date, scope });

      await redis.del(key);

      return res.status(200).json({
        ok: true,
        key,
        date: date || null,
        scope: scope || 'daily',
      });
    }

    res.setHeader('Allow', 'GET, PUT, POST, DELETE');

    return res.status(405).json({
      ok: false,
      error: 'método não permitido',
    });
  } catch (err) {
    console.error('[api/planner] erro:', err);

    return res.status(500).json({
      ok: false,
      error: 'erro interno',
      detail: String(err.message || err),
    });
  }
}