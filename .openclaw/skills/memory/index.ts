import sqlite3 from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.MEMORY_DB_PATH || '/data/.openclaw/memory.db';
const db = sqlite3(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT,
    role TEXT CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT,
    tokens INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id);
`);

export async function getOrCreateConversation(userId: string): Promise<string> {
  let conv = db.prepare('SELECT id FROM conversations WHERE user_id = ?').get(userId);
  if (!conv) {
    const id = `conv_${userId}_${Date.now()}`;
    db.prepare('INSERT INTO conversations (id, user_id) VALUES (?, ?)').run(id, userId);
    console.log(`[MEMORY] New conversation: ${id}`);
    return id;
  }
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conv.id);
  return conv.id;
}

export async function saveMessage(conversationId: string, role: string, content: string, tokens: number = 0): Promise<void> {
  db.prepare('INSERT INTO messages (conversation_id, role, content, tokens) VALUES (?, ?, ?, ?)').run(conversationId, role, content, tokens);
}

export async function getRecentMessages(conversationId: string, limit: number = 10): Promise<any[]> {
  return db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?').all(conversationId, limit).reverse();
}

export async function getConversationHistory(conversationId: string, maxTokens: number = 4000): Promise<string> {
  const messages = db.prepare('SELECT role, content, tokens FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId) as any[];
  
  let totalTokens = 0;
  const history: string[] = [];
  
  for (const msg of messages) {
    const estimatedTokens = msg.tokens || Math.ceil(msg.content.length / 4);
    if (totalTokens + estimatedTokens > maxTokens) break;
    totalTokens += estimatedTokens;
    history.push(`${msg.role}: ${msg.content}`);
  }
  
  return history.join('\n\n');
}
