import { queryLLM } from '../../../src/llm/router';

export async function summarize(text: string): Promise<string> {
  const truncated = text.slice(0, 12000);
  const tokenEstimate = Math.ceil(truncated.length / 4);
  
  console.log(`[SUMMARIZE] Input ~${tokenEstimate} tokens, budgeting 500 output`);
  
  return await queryLLM(
    `Summarize this concisely in 3-5 bullet points. Be specific and factual.\n\nTEXT:\n${truncated}`,
    'You are a summarization expert. Output only the summary, no preamble.'
  );
}
