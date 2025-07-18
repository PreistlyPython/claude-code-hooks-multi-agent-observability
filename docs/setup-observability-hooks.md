# Setup Guide: Adding Observability Hooks to Your Claude Code Project

## TL;DR - Why This Session Doesn't Appear in Observability

**The current project directory (`/home/dell/coding/bash/10x-agentic-setup`) doesn't have the observability hooks configured.** Your Claude Code session is running from this directory, but it only has the standard 10x commands setup - not the observability hooks.

## Required Conditions for Observability

For a Claude Code session to appear in the observability dashboard, **ALL** of these conditions must be met:

1. ✅ **Observability Server Running**: The server must be running on port 4000
2. ✅ **Client Dashboard Running**: The client must be running on port 5173
3. ❌ **Hooks Configuration**: The project must have `.claude/settings.json` with hook configurations
4. ❌ **Hook Scripts**: The project must have the actual hook scripts in `.claude/hooks/`
5. ❌ **Dependencies**: The project must have `uv` installed and Python dependencies

## Current Status Check

### ✅ Server Status
```bash
# Check if observability server is running
curl -s http://localhost:4000/events/recent
# Should return: [] (empty array if no events)

# Check if client is running
curl -s http://localhost:5173
# Should return: HTML page
```

### ❌ Missing: Hook Configuration
Your current project has:
- `/home/dell/coding/bash/10x-agentic-setup/.claude/config.json` (10x setup)
- **Missing**: `/home/dell/coding/bash/10x-agentic-setup/.claude/settings.json` (hooks)
- **Missing**: `/home/dell/coding/bash/10x-agentic-setup/.claude/hooks/` directory

## Quick Setup (5 Minutes)

### Option 1: Copy Complete Setup
```bash
# Navigate to your current project
cd /home/dell/coding/bash/10x-agentic-setup

# Copy the observability hooks
cp -r claude-code-hooks-multi-agent-observability/.claude/hooks .claude/
cp claude-code-hooks-multi-agent-observability/.claude/settings.json .claude/

# Update the source app name to identify this project
sed -i 's/cc-hook-multi-agent-obvs/10x-agentic-setup/g' .claude/settings.json

# Update paths to absolute paths
sed -i "s|/home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability|/home/dell/coding/bash/10x-agentic-setup|g" .claude/settings.json
```

### Option 2: Use the Conversion Command
```bash
# In Claude Code, run:
/convert_paths_absolute
```

## Manual Setup (Detailed)

### Step 1: Create settings.json
```bash
# Create the settings.json file
cat > /home/dell/coding/bash/10x-agentic-setup/.claude/settings.json << 'EOF'
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/pre_tool_use.py"
          },
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type PreToolUse"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/post_tool_use.py"
          },
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type PostToolUse"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/notification.py --notify "
          },
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type Notification"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/stop.py --chat"
          },
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type Stop --add-chat"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/subagent_stop.py"
          },
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type SubagentStop"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type PreCompact"
          }
        ]
      }
    ]
  }
}
EOF
```

### Step 2: Copy Hook Scripts
```bash
# Create hooks directory
mkdir -p /home/dell/coding/bash/10x-agentic-setup/.claude/hooks

# Copy all hook scripts
cp /home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability/.claude/hooks/* /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/
```

### Step 3: Verify Dependencies
```bash
# Check if uv is installed
which uv

# If not installed:
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Step 4: Test the Setup
```bash
# Test sending an event manually
cd /home/dell/coding/bash/10x-agentic-setup
uv run .claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type Test
```

## Testing Your Setup

### Method 1: Manual Test
```bash
# Send a test event
cd /home/dell/coding/bash/10x-agentic-setup
uv run .claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type Test

# Check if it appears in the dashboard
curl -s http://localhost:4000/events/recent | jq '.'
```

### Method 2: Run a Claude Command
After setting up the hooks, run any Claude Code command:
```bash
# In Claude Code, run:
List the files in the current directory
```

You should immediately see events appearing in:
- The observability dashboard at `http://localhost:5173`
- The API endpoint at `http://localhost:4000/events/recent`

## Common Issues & Solutions

### Issue 1: "uv: command not found"
**Solution**: Install uv
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

### Issue 2: "No module named 'requests'"
**Solution**: Install Python dependencies
```bash
cd /home/dell/coding/bash/10x-agentic-setup
uv add requests
```

### Issue 3: "Connection refused to localhost:4000"
**Solution**: Start the observability server
```bash
cd /home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability
./scripts/start-system.sh
```

### Issue 4: Hooks not executing
**Solution**: Check file permissions
```bash
chmod +x /home/dell/coding/bash/10x-agentic-setup/.claude/hooks/*.py
```

### Issue 5: Wrong paths in settings.json
**Solution**: Use absolute paths
```bash
# In Claude Code, run:
/convert_paths_absolute
```

## Verification Checklist

After setup, verify these items:

- [ ] ✅ Observability server running on port 4000
- [ ] ✅ Client dashboard running on port 5173
- [ ] ✅ `.claude/settings.json` exists with hook configurations
- [ ] ✅ `.claude/hooks/` directory exists with Python scripts
- [ ] ✅ `uv` is installed and accessible
- [ ] ✅ Python dependencies are installed
- [ ] ✅ Hook scripts have execute permissions
- [ ] ✅ All paths in settings.json are absolute
- [ ] ✅ Source app name is unique for this project

## Expected Behavior

Once properly configured, every Claude Code action will:

1. **PreToolUse**: Trigger before any tool execution
2. **PostToolUse**: Trigger after tool completion
3. **Notification**: Trigger for user interactions
4. **Stop**: Trigger when response is complete
5. **SubagentStop**: Trigger when subagents complete
6. **PreCompact**: Trigger before context compaction

You'll see these events in real-time in the dashboard with:
- Event type and timestamp
- Tool name and parameters
- Execution results
- Performance metrics
- Chat transcripts (optional)

## Advanced Configuration

### Custom Event Types
You can add custom event types by modifying settings.json:
```json
{
  "hooks": {
    "CustomEvent": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run .claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type CustomEvent"
          }
        ]
      }
    ]
  }
}
```

### Multiple Projects
For multiple projects, use different source app names:
```json
{
  "command": "uv run .claude/hooks/send_event.py --source-app my-unique-project-name --event-type PreToolUse"
}
```

### Performance Optimization
For high-volume environments, consider:
- Using `--no-chat` flag to reduce data
- Implementing sampling in hook scripts
- Using separate server instances

## Troubleshooting

### Debug Mode
Enable debug logging:
```bash
export CLAUDE_HOOKS_DEBUG=1
```

### Check Logs
```bash
# Check server logs
cd /home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability
tail -f logs/server.log

# Check hook execution
cd /home/dell/coding/bash/10x-agentic-setup
uv run .claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type Test --debug
```

### Network Issues
```bash
# Check if server is accessible
curl -v http://localhost:4000/events/recent

# Check if client is accessible
curl -v http://localhost:5173
```

## Quick Fix for Current Session

To immediately start seeing events from your current session:

```bash
# 1. Quick setup (run this in terminal)
cd /home/dell/coding/bash/10x-agentic-setup
cp -r claude-code-hooks-multi-agent-observability/.claude/hooks .claude/
cp claude-code-hooks-multi-agent-observability/.claude/settings.json .claude/
sed -i 's/cc-hook-multi-agent-obvs/10x-agentic-setup/g' .claude/settings.json
sed -i "s|/home/dell/coding/bash/10x-agentic-setup/claude-code-hooks-multi-agent-observability|/home/dell/coding/bash/10x-agentic-setup|g" .claude/settings.json

# 2. Test it works
uv run .claude/hooks/send_event.py --source-app 10x-agentic-setup --event-type Test

# 3. Check dashboard
# Open http://localhost:5173 in browser
```

After this setup, **every Claude Code action in this session will appear in the observability dashboard**!