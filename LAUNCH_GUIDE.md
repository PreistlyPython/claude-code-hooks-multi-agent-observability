# 🚀 Launch & Termination Guide - Multi-Agent Observability System

## 📍 Access URLs
- **Dashboard UI**: http://localhost:5173
- **Server API**: http://localhost:4000
- **WebSocket**: ws://localhost:4000/stream
- **Events API**: http://localhost:4000/events/recent

## 🟢 Starting the System

### Method 1: Full System (Recommended)
```bash
cd /home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability
./scripts/start-system.sh
```

### Method 2: Manual Start (More Control)
```bash
# Terminal 1 - Start Server
cd /home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability/apps/server
export PATH="$HOME/.bun/bin:$PATH"
bun run dev

# Terminal 2 - Start Client  
cd /home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability/apps/client
npm run dev
```

## 🔴 Stopping the System

### Method 1: Reset Script (Recommended)
```bash
cd /home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability
./scripts/reset-system.sh
```

### Method 2: Manual Stop
```bash
# Kill specific ports
lsof -ti:4000 | xargs kill -9  # Kill server
lsof -ti:5173 | xargs kill -9  # Kill client

# Or find and kill by process name
pkill -f "bun.*server"
pkill -f "vite"
```

## 🔍 Checking System Status

```bash
# Check if services are running
lsof -i:4000  # Server
lsof -i:5173  # Client

# Test server API
curl http://localhost:4000/events/recent

# View real-time events
watch -n 1 curl -s http://localhost:4000/events/recent
```

## 🎯 Using with Claude Code

### Current Directory (Already Active)
The hooks are already configured in this directory. Just run Claude Code normally:
```bash
claude "analyze this codebase"
```

### Other Projects
```bash
# Copy hooks to another project
cp -R /home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability/.claude /path/to/your/project/

# Update source-app name in settings.json
sed -i 's/cc-hook-multi-agent-obvs/your-project-name/g' /path/to/your/project/.claude/settings.json
```

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Reset the system
./scripts/reset-system.sh

# Or manually kill processes on ports
lsof -ti:4000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Client Won't Start
```bash
cd apps/client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Server Won't Start
```bash
cd apps/server
export PATH="$HOME/.bun/bin:$PATH"
rm -rf node_modules bun.lockb
bun install
bun run dev
```

### View Logs
```bash
# Server logs are printed to console
# Client logs visible in browser DevTools (F12)
```

## 📊 Quick Test

```bash
# Send test event
curl -X POST http://localhost:4000/events \
  -H "Content-Type: application/json" \
  -d '{
    "source_app": "test",
    "session_id": "test-123",
    "hook_event_type": "PreToolUse",
    "payload": {"tool_name": "Bash", "tool_input": {"command": "ls"}}
  }'

# View in dashboard
open http://localhost:5173
```

## 🔄 Complete Reset
```bash
# Stop everything and clean data
./scripts/reset-system.sh
# When prompted, press 'y' to clear database
```