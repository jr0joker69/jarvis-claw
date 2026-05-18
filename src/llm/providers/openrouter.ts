export async function chat(messages: any[]): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/jr0joker69/Jarvis-claw'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      max_tokens: 4096
    }),
    timeout: 20000
  });
  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
