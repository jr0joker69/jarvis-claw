export class TavilySearch {
  private apiKey: string;
  constructor(apiKey: string) { this.apiKey = apiKey; }
  
  async search(query: string, opts: { maxResults?: number; includeImages?: boolean; search_depth?: string } = {}): Promise<any[]> {
    const { maxResults = 5, includeImages = false, search_depth = 'advanced' } = opts;
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ 
        api_key: this.apiKey, 
        query, 
        max_results: maxResults, 
        include_images: includeImages, 
        search_depth: search_depth,
        include_answer: false
      }),
      timeout: 30000
    });
    if (!res.ok) throw new Error(`Tavily API error: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  }
}

export async function webSearch(query: string): Promise<string> {
  const search = new TavilySearch(process.env.TAVILY_API_KEY || '');
  try {
    const results = await search.search(query, { maxResults: 5, includeImages: false });
    if (results.length === 0) return '[No web results found]';
    return results.map(r => `<!--citation:1-->\n${r.content}`).join('\n\n---\n\n');
  } catch (err: any) {
    console.error(`[WEB SEARCH ERROR] ${err.message}`);
    return '[Web search failed — continuing without it]';
  }
}

export function needsWebSearch(query: string): boolean {
  const triggers = ['current', 'today', 'latest', 'news', 'price', 'recent', 'now', '2025', 'breaking', 'just now', 'update', 'happening', 'latest news'];
  return triggers.some(t => query.toLowerCase().includes(t));
}
