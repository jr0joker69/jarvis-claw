import { TavilySearch } from '../../../src/llm/tools/web-search';
import { cache } from '../../../src/utils/cache';

const search = new TavilySearch(process.env.TAVILY_API_KEY || '');

export async function webSearch(query: string): Promise<string> {
  // Check cache first
  const cacheKey = `web:${query.slice(0, 100)}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] web search for: ${query.slice(0, 30)}...`);
    return cached;
  }

  console.log(`[WEB SEARCH] ${query.slice(0, 50)}...`);
  const results = await search.search(query, { 
    maxResults: 5, 
    includeImages: false,
    search_depth: 'advanced'
  });

  const formatted = results.map(r => `\n<!--citation:1-->\n${r.content}`).join('\n\n---\n\n');

  // Cache for 5 minutes
  await cache.set(cacheKey, formatted, 300);

  return formatted;
}

export function needsWebSearch(query: string): boolean {
  const triggers = [
    'current', 'today', 'latest', 'news', 'price', 'recent', 
    'now', '2025', 'breaking', 'just now', 'update', 'happening'
  ];
  return triggers.some(t => query.toLowerCase().includes(t));
}
