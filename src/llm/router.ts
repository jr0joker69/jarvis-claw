import { callWithBreaker, getBreaker } from '../utils/circuit-breaker';
import { cacheManager } from '../utils/cache';
import type { providers } from './providers';

const priority = (process.env.PRIMARY_LLM || 'gemini').split(',').map(s => s.trim());

export async function queryLLM(prompt: string, systemPrompt?: string, userId?: string): Promise<string> {
  const messages = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
    : [{ role: 'user', content: prompt }];

  // Check cache
  const cacheKey = `llm:${systemPrompt ? 'sp' : 'np'}:${prompt.slice(0, 100)}`;
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] LLM response`);
    return cached;
  }

  // Try each provider in priority order
  for (const providerName of priority) {
    try {
      const provider = providers[providerName];
      if (!provider) continue;
      
      const result = await callWithBreaker(providerName, () => provider.chat(messages));
      if (result && result.trim().length > 0) {
        // Cache successful response
        await cacheManager.set(cacheKey, result, 120); // 2 min cache
        return result;
      }
    } catch (err: any) {
      console.log(`⚠️ ${providerName} failed: ${err.message}, trying next...`);
      continue;
    }
  }

  throw new Error(`All LLM providers failed. Last error: ${getBreaker(priority[priority.length - 1]).failures} failures`);
}

export async function queryWithWebSearch(query: string, userId?: string): Promise<string> {
  const needsSearch = /current|today|latest|news|price|recent|2025|breaking|happening/i.test(query);
  
  if (needsSearch && process.env.TAVILY_API_KEY) {
    const { webSearch } = await import('../tools/web-search');
    const results = await webSearch(query);
    const augmentedPrompt = `Using this fresh web data, answer the question. Cite sources.\n\n[WEB DATA]\n${results}\n\n[QUESTION]\n${query}`;
    return queryLLM(augmentedPrompt, 'You are Jarvis Claw. Use the web data above. Be factual and cite sources.', userId);
  }
  
  return queryLLM(query, undefined, userId);
}
