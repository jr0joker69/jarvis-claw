# Jarvis Claw Changelog

## v1.0.0 (2025-05-17)
### Infrastructure
- Official openclaw/openclaw source (shallow clone, 50MB)
- Multi-LLM router with automatic failover: Gemini → Groq → Mistral → OpenRouter
- Tavily web search for knowledge cutoff bypass (cached, 5min TTL)
- Persistent SQLite memory on Render /data disk
- Telegram webhook + long-polling support
- ClawHub skill store integration
- Version-controlled infrastructure (VERSION file)

### LLM Router Enhancements
- Retry logic (3 attempts, exponential backoff)
- Circuit breaker per provider (fails fast after 3 consecutive failures)
- Request caching (Redis-style in-memory, 2min TTL)
- Cost tracking per provider
- Automatic provider selection based on query type

### Skills
- web-search: Tavily API with result caching
- github: Repo search, file read, issue creation
- summarize: LLM-powered with token budgeting
- memory: Persistent conversation history (SQLite)

### Production Features
- Health check endpoint (GET /health)
- Graceful shutdown (SIGTERM handling)
- Structured logging (JSON)
- Rate limiting (10 req/min per chat)
- Auto-restart on crash
