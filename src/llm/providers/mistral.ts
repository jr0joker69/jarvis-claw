export async function chat(messages: any[]): Promise<string> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      max_tokens: 4096
    }),
    timeout: 15000
  });
  if (!res.ok) throw new Error(`Mistral API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
