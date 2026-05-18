#!/bin/bash
set -e

VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
echo "🤖 Jarvis Claw v$VERSION — Starting..."
echo "🕐 $(date)"

CONFIG_DIR="/data/.openclaw"
SKILLS_DIR="$CONFIG_DIR/skills"
MEMORY_DB="$CONFIG_DIR/memory.db"
LOG_DIR="$CONFIG_DIR/logs"

mkdir -p "$CONFIG_DIR" "$SKILLS_DIR" "$LOG_DIR"

# Copy config and skills
if [ ! -f "$CONFIG_DIR/config.json" ]; then
  echo "📝 Creating default config..."
  cp .openclaw/config.json "$CONFIG_DIR/config.json"
fi

for skill in .openclaw/skills/*/; do
  skill_name=$(basename "$skill")
  cp -r "$skill" "$SKILLS_DIR/$skill_name/"
done

# Initialize SQLite memory
if [ ! -f "$MEMORY_DB" ]; then
  echo "🗄️ Initializing SQLite memory database..."
  sqlite3 "$MEMORY_DB" "CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, user_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);"
  sqlite3 "$MEMORY_DB" "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id TEXT, role TEXT, content TEXT, tokens INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);"
fi

echo "✅ Persistent storage ready at $CONFIG_DIR"
echo "🚀 Starting Jarvis Claw Gateway on :18789..."
echo "📊 PID: $$"

# Trap SIGTERM for graceful shutdown
trap 'echo "🛑 SIGTERM received, shutting down..."; kill $NODE_PID 2>/dev/null || true; exit 0' SIGTERM SIGINT

# Start Node process in background
node dist/index.js gateway --port 18789 --bind 0.0.0.0 &
NODE_PID=$!

# Wait for process
wait $NODE_PID
