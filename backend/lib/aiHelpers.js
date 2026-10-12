// Shared AI helpers: model standardization, parseAIJson 3-strategy, ai_results table.
const fetch = require('node-fetch');
const {currentSignal} = require('../services/nativeAIContext');
const persistNativeAI = require('../services/persistNativeAI');

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(systemPrompt, userPrompt, opts = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  if (Array.isArray(userPrompt)) {
    messages.push(...userPrompt);
  } else {
    messages.push({ role: 'user', content: userPrompt });
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    signal: opts.signal || currentSignal(),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
      'X-Title': 'Temple Management System',
    },
    body: JSON.stringify({
      model: opts.model || DEFAULT_MODEL,
      messages,
      max_tokens: opts.max_tokens || 1500,
      temperature: opts.temperature ?? 0.7,
    }),
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${txt.slice(0, 500)}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data;
}

// 3-strategy JSON parser used across all AI endpoints
function parseAIJson(text) {
  if (!text || typeof text !== 'string') return null;
  try { return JSON.parse(text); } catch (_) {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try { return JSON.parse(fenced[1].trim()); } catch (_) {}
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch (_) {}
  }
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch (_) {}
  }
  return null;
}

let aiResultsEnsured = false;
async function ensureAIResultsTable(pool) {
  if (aiResultsEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      feature VARCHAR(100) NOT NULL,
      input JSONB,
      output JSONB,
      raw_text TEXT,
      model VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ai_results_feature ON ai_results(feature);
    CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_results_created_at ON ai_results(created_at DESC);
  `);
  await pool.query('ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS review_notes TEXT');
  aiResultsEnsured = true;
}

async function saveAIResult(pool, { user_id, feature, input, output, raw_text, model, id, nativeWrite }) {
    const signal = currentSignal();
    if (signal?.aborted) throw Object.assign(new Error('The request was cancelled.'), {name:'AbortError'});
    await ensureAIResultsTable(pool);
    const values=[user_id || null, feature, JSON.stringify(input || {}), JSON.stringify(output || null), raw_text || null, model || DEFAULT_MODEL];
    const result = await persistNativeAI(pool, signal || new AbortController().signal, async client => {
      if(nativeWrite)await nativeWrite(client);
      return id === undefined
        ? client.query(`INSERT INTO ai_results (user_id, feature, input, output, raw_text, model) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,created_at`, values)
        : client.query(`UPDATE ai_results SET input=$3,output=$4,raw_text=$5,model=$6 WHERE user_id=$1 AND feature=$2 AND id=$7 RETURNING id,created_at`, [...values,id]);
    });
    if(!result.rows.length) throw Error('The saved report no longer exists.');
    return result.rows[0];
}

module.exports = { callOpenRouter, parseAIJson, ensureAIResultsTable, saveAIResult, DEFAULT_MODEL };
