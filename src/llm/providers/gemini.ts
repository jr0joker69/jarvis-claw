export async function chat(messages: any[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 4096, temperature: parseFloat(process.env.TEMPERATURE || '0.7') }
      }),
      timeout: 15000
    }
  );
  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
