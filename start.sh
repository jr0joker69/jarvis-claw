#!/bin/bash
set -e

VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
echo "🤖 Jarvis Claw v$VERSION — Starting..."
echo "🕐 $(date)"

# Free tier: use /tmp (resets on restart, but works without paid disk)
# Paid tier: change to /data
CONFIG_DIR="${PERSISTENT_DIR:-/tmp/.openclaw}"
SKILLS_DIR="$CONFIG_DIR/skills"
MEMORY_DB="$CONFIG_DIR/memory.db"
LOG_DIR="$CONFIG_DIR/logs"

mkdir -p "$CONFIG_DIR" "$SKILLS_DIR" "$LOG_DIR"

# Copy config on every start (since /tmp resets)
echo "📝 Loading config..."
cp .openclaw/config.json "$CONFIG_DIR/config.json" 2>/dev/null || true

# Copy skills
for skill in .openclaw/skills/*/; do
  skill_name=$(basename "$skill")
  mkdir -p "$SKILLS_DIR/$skill_name"
  cp -r "$skill"* "$SKILLS_DIR/$skill_name/" 2>/dev/null || true
done

# Initialize SQLite memory
if [ ! -f "$MEMORY_DB" ]; then
  echo "🗄️ Initializing SQLite memory..."
  sqlite3 "$MEMORY_DB" "
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT,
      role TEXT,
      content TEXT,
      tokens INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  " 2>/dev/null || echo "⚠️ SQLite not available, memory disabled"
fi

echo "✅ Storage ready at $CONFIG_DIR"
echo "🚀 Starting Jarvis Claw Gateway on port ${PORT:-18789}..."

# Graceful shutdown
trap 'echo "🛑 Shutting down..."; kill $NODE_PID 2>/dev/null; exit 0' SIGTERM SIGINT

node dist/index.js gateway \
  --port "${PORT:-18789}" \
  --bind 0.0.0.0 &
NODE_PID=$!

wait $NODE_PID
