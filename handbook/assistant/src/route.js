// Deterministic routing: cheapest sufficient path first. The model is only reached when the question needs
// synthesis and retrieval has something solid to stand on.
const LIVE = /(who is the best|best player|online now|server status|current price|price of|how many players|population|leaderboard|who's online)/i;
const LOOKUP = /^(where|who|what is|what are|find|show|look up|tell me where|which page)\b/i;
const EXPLAIN = /(how|why|explain|what happens|what should|compare|difference|better|best|should i|worth it|walk me through)/i;
const COMPARE = /(compare|difference|better|best|versus|vs\.?|which .* should)/i;

export function routeQuestion(question, hits, { allowEscalation = false } = {}) {
  const query = String(question ?? '').trim();
  if (!query) return { kind: 'invalid', reason: 'empty question' };
  if (LIVE.test(query)) return { kind: 'refuse', reason: 'live or player-specific question' };
  if (!hits?.length) return { kind: 'static', reason: 'no retrieval match' };
  const top = hits[0];
  if (top.score < 2.5 && !EXPLAIN.test(query)) return { kind: 'static', reason: 'weak retrieval' };
  if (LOOKUP.test(query) && !EXPLAIN.test(query)) return { kind: 'static', reason: 'page or fact lookup' };
  if (COMPARE.test(query) && allowEscalation) return { kind: 'gemma', reason: 'comparison with escalation enabled' };
  return { kind: 'qwen', reason: 'explanatory question with retrieved context' };
}

export const MODELS = Object.freeze({
  qwen: '@cf/qwen/qwen3-30b-a3b-fp8',
  gemma: '@cf/google/gemma-4-26b-a4b-it'
});
