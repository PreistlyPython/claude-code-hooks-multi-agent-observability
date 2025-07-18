# 🔌 Agent Performance Dashboard Cards - API Specification

**Project**: Multi-Agent Observability System  
**Feature**: Agent Performance Dashboard Cards  
**Created**: 2025-07-16 18:09:05  
**Version**: 1.0  
**API Version**: v1  

## 📋 Overview

This document defines the API contracts, data models, and integration patterns required for the Agent Performance Dashboard Cards feature. The API supports both REST endpoints for initial data loading and WebSocket connections for real-time updates.

## 🔗 API Endpoints

### REST API Endpoints

#### 1. Get All Agent Performance Data
```http
GET /api/v1/agents/performance
```

**Description**: Retrieves current performance data for all active agents

**Query Parameters**:
- `limit` (optional): Maximum number of agents to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by agent status (`online`, `offline`, `error`)
- `sort` (optional): Sort order (`performance_score`, `success_rate`, `cost`)

**Response**:
```json
{
  "data": [
    {
      "agentId": "agent-001",
      "isOnline": true,
      "lastSeen": "2025-07-16T18:09:05.123Z",
      "metrics": {
        "toolExecutionSpeed": 450,
        "tokenEfficiency": 85,
        "successRate": 96.5,
        "tokensPerMinute": 1250,
        "costPerHour": 0.23,
        "performanceScore": 92
      },
      "trends": {
        "speedChange": -5.2,
        "successRateChange": 2.1,
        "efficiencyChange": 8.7,
        "costChange": -12.3
      },
      "currentTask": {
        "id": "task-abc123",
        "name": "Analyzing customer data",
        "type": "analysis",
        "progress": 65,
        "startedAt": "2025-07-16T18:05:30.000Z",
        "estimatedCompletion": "2025-07-16T18:12:15.000Z"
      },
      "errors": {
        "count": 0,
        "lastError": null,
        "errorRate": 0.02
      }
    }
  ],
  "metadata": {
    "total": 45,
    "online": 42,
    "offline": 2,
    "error": 1,
    "lastUpdated": "2025-07-16T18:09:05.123Z",
    "averagePerformanceScore": 88.5
  }
}
```

#### 2. Get Specific Agent Performance Data
```http
GET /api/v1/agents/{agentId}/performance
```

**Description**: Retrieves detailed performance data for a specific agent

**Path Parameters**:
- `agentId`: Unique identifier for the agent

**Response**:
```json
{
  "data": {
    "agentId": "agent-001",
    "isOnline": true,
    "lastSeen": "2025-07-16T18:09:05.123Z",
    "connectionInfo": {
      "connectedAt": "2025-07-16T17:30:00.000Z",
      "reconnectAttempts": 0,
      "latency": 45,
      "quality": "excellent"
    },
    "metrics": {
      "toolExecutionSpeed": 450,
      "tokenEfficiency": 85,
      "successRate": 96.5,
      "tokensPerMinute": 1250,
      "costPerHour": 0.23,
      "performanceScore": 92,
      "tasksCompleted": 147,
      "averageTaskDuration": 2.3
    },
    "trends": {
      "period": "1h",
      "speedChange": -5.2,
      "successRateChange": 2.1,
      "efficiencyChange": 8.7,
      "costChange": -12.3,
      "trendDirection": "improving"
    },
    "currentTask": {
      "id": "task-abc123",
      "name": "Analyzing customer data",
      "type": "analysis",
      "progress": 65,
      "startedAt": "2025-07-16T18:05:30.000Z",
      "estimatedCompletion": "2025-07-16T18:12:15.000Z",
      "toolsInvolved": ["data_analyzer", "pattern_detector"],
      "tokensUsed": 1450
    },
    "errors": {
      "count": 0,
      "lastError": null,
      "errorRate": 0.02,
      "recentErrors": []
    }
  }
}
```

#### 3. Get Agent Performance History
```http
GET /api/v1/agents/{agentId}/performance/history
```

**Description**: Retrieves historical performance data for trend analysis

**Path Parameters**:
- `agentId`: Unique identifier for the agent

**Query Parameters**:
- `period`: Time period (`1h`, `6h`, `24h`, `7d`) (default: `24h`)
- `granularity`: Data point frequency (`1m`, `5m`, `15m`, `1h`) (default: `5m`)
- `metrics`: Comma-separated list of metrics to include

**Response**:
```json
{
  "data": {
    "agentId": "agent-001",
    "period": "24h",
    "granularity": "5m",
    "dataPoints": [
      {
        "timestamp": "2025-07-16T17:00:00.000Z",
        "metrics": {
          "toolExecutionSpeed": 480,
          "successRate": 94.2,
          "tokensPerMinute": 1180,
          "costPerHour": 0.26
        }
      },
      {
        "timestamp": "2025-07-16T17:05:00.000Z",
        "metrics": {
          "toolExecutionSpeed": 465,
          "successRate": 95.1,
          "tokensPerMinute": 1220,
          "costPerHour": 0.25
        }
      }
    ],
    "summary": {
      "min": {
        "toolExecutionSpeed": 420,
        "successRate": 91.5,
        "tokensPerMinute": 980,
        "costPerHour": 0.18
      },
      "max": {
        "toolExecutionSpeed": 680,
        "successRate": 98.2,
        "tokensPerMinute": 1450,
        "costPerHour": 0.32
      },
      "average": {
        "toolExecutionSpeed": 467,
        "successRate": 95.3,
        "tokensPerMinute": 1215,
        "costPerHour": 0.24
      }
    }
  }
}
```

#### 4. Get System-wide Performance Summary
```http
GET /api/v1/system/performance/summary
```

**Description**: Retrieves aggregated performance metrics across all agents

**Response**:
```json
{
  "data": {
    "timestamp": "2025-07-16T18:09:05.123Z",
    "agentCounts": {
      "total": 45,
      "online": 42,
      "offline": 2,
      "error": 1
    },
    "aggregateMetrics": {
      "averageExecutionSpeed": 523,
      "systemSuccessRate": 93.7,
      "totalTokensPerMinute": 52300,
      "totalCostPerHour": 10.45,
      "systemPerformanceScore": 88.5
    },
    "trends": {
      "performanceChange": 3.2,
      "costEfficiencyChange": -8.1,
      "reliabilityChange": 1.5
    },
    "alerts": [
      {
        "type": "warning",
        "message": "Agent agent-042 has high error rate",
        "severity": "medium",
        "agentId": "agent-042"
      }
    ]
  }
}
```

## 🔌 WebSocket API

### Connection Endpoints

#### 1. Global Performance Stream
```
ws://localhost:4000/api/v1/stream/performance
```

**Description**: Real-time updates for all agent performance data

**Connection Parameters**:
- `updateInterval`: Update frequency in milliseconds (default: 1000)
- `agentFilter`: Comma-separated list of agent IDs to monitor
- `metricFilter`: Comma-separated list of metrics to include

#### 2. Agent-specific Performance Stream
```
ws://localhost:4000/api/v1/agents/{agentId}/stream
```

**Description**: Real-time updates for a specific agent

## 📡 WebSocket Message Protocols

### Incoming Messages (Server → Client)

#### 1. Agent Metrics Update
```json
{
  "type": "agent_metrics_update",
  "timestamp": "2025-07-16T18:09:05.123Z",
  "data": {
    "agentId": "agent-001",
    "metrics": {
      "toolExecutionSpeed": 450,
      "tokenEfficiency": 85,
      "successRate": 96.5,
      "tokensPerMinute": 1250,
      "costPerHour": 0.23
    },
    "trends": {
      "speedChange": -5.2,
      "successRateChange": 2.1
    },
    "currentTask": {
      "id": "task-abc123",
      "name": "Analyzing customer data",
      "progress": 67
    }
  }
}
```

#### 2. Agent Status Change
```json
{
  "type": "agent_status_change",
  "timestamp": "2025-07-16T18:09:05.123Z",
  "data": {
    "agentId": "agent-001",
    "previousStatus": "online",
    "currentStatus": "offline",
    "reason": "connection_timeout"
  }
}
```

#### 3. Agent Task Update
```json
{
  "type": "agent_task_update",
  "timestamp": "2025-07-16T18:09:05.123Z",
  "data": {
    "agentId": "agent-001",
    "taskId": "task-abc123",
    "event": "started" | "progress" | "completed" | "failed",
    "progress": 0,
    "details": {
      "name": "Analyzing customer data",
      "type": "analysis",
      "estimatedDuration": 420000
    }
  }
}
```

#### 4. Agent Error Event
```json
{
  "type": "agent_error",
  "timestamp": "2025-07-16T18:09:05.123Z",
  "data": {
    "agentId": "agent-001",
    "error": {
      "id": "error-xyz789",
      "message": "Connection timeout to external API",
      "type": "timeout_error",
      "severity": "medium",
      "stackTrace": "...",
      "context": {
        "tool": "api_caller",
        "endpoint": "https://api.example.com/data"
      }
    }
  }
}
```

#### 5. System Health Update
```json
{
  "type": "system_health_update",
  "timestamp": "2025-07-16T18:09:05.123Z",
  "data": {
    "overallHealth": "good",
    "agentCounts": {
      "total": 45,
      "online": 42,
      "offline": 2,
      "error": 1
    },
    "systemMetrics": {
      "averagePerformanceScore": 88.5,
      "totalCostPerHour": 10.45,
      "systemLoad": 0.65
    }
  }
}
```

### Outgoing Messages (Client → Server)

#### 1. Subscribe to Agent Updates
```json
{
  "type": "subscribe_agent",
  "data": {
    "agentId": "agent-001",
    "updateInterval": 1000,
    "metrics": ["toolExecutionSpeed", "successRate", "tokenEfficiency"]
  }
}
```

#### 2. Unsubscribe from Agent Updates
```json
{
  "type": "unsubscribe_agent",
  "data": {
    "agentId": "agent-001"
  }
}
```

#### 3. Subscribe to System Updates
```json
{
  "type": "subscribe_system",
  "data": {
    "updateInterval": 5000,
    "includeAlerts": true
  }
}
```

#### 4. Request Agent Action
```json
{
  "type": "agent_action",
  "data": {
    "agentId": "agent-001",
    "action": "restart" | "pause" | "resume" | "stop",
    "parameters": {}
  }
}
```

## 📊 Data Models

### TypeScript Interface Definitions

#### Core Agent Data
```typescript
interface AgentPerformanceData {
  agentId: string;
  isOnline: boolean;
  lastSeen: string; // ISO 8601 timestamp
  connectionInfo?: ConnectionInfo;
  metrics: AgentMetrics;
  trends: MetricTrends;
  currentTask?: TaskProgress;
  errors: ErrorStatus;
}

interface ConnectionInfo {
  connectedAt: string;
  reconnectAttempts: number;
  latency: number; // milliseconds
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface AgentMetrics {
  toolExecutionSpeed: number; // milliseconds
  tokenEfficiency: number; // tokens per successful task
  successRate: number; // percentage (0-100)
  tokensPerMinute: number;
  costPerHour: number; // USD
  performanceScore: number; // 0-100 calculated score
  tasksCompleted?: number;
  averageTaskDuration?: number; // minutes
}

interface MetricTrends {
  period: string; // e.g., "1h", "24h"
  speedChange: number; // percentage change
  successRateChange: number; // percentage change
  efficiencyChange: number; // percentage change
  costChange: number; // percentage change
  trendDirection: 'improving' | 'stable' | 'degrading';
}

interface TaskProgress {
  id: string;
  name: string;
  type: 'analysis' | 'processing' | 'communication' | 'other';
  progress: number; // percentage (0-100)
  startedAt: string;
  estimatedCompletion?: string;
  toolsInvolved?: string[];
  tokensUsed?: number;
}

interface ErrorStatus {
  count: number;
  lastError?: {
    id: string;
    timestamp: string;
    message: string;
    type: string;
    severity: 'low' | 'medium' | 'high';
    stackTrace?: string;
    context?: Record<string, any>;
  };
  errorRate: number; // errors per hour
  recentErrors?: ErrorInfo[];
}

interface ErrorInfo {
  id: string;
  timestamp: string;
  message: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
}
```

#### System-wide Data
```typescript
interface SystemPerformanceSummary {
  timestamp: string;
  agentCounts: {
    total: number;
    online: number;
    offline: number;
    error: number;
  };
  aggregateMetrics: {
    averageExecutionSpeed: number;
    systemSuccessRate: number;
    totalTokensPerMinute: number;
    totalCostPerHour: number;
    systemPerformanceScore: number;
  };
  trends: {
    performanceChange: number;
    costEfficiencyChange: number;
    reliabilityChange: number;
  };
  alerts: SystemAlert[];
}

interface SystemAlert {
  type: 'info' | 'warning' | 'error';
  message: string;
  severity: 'low' | 'medium' | 'high';
  agentId?: string;
  timestamp: string;
  acknowledged?: boolean;
}
```

#### WebSocket Message Types
```typescript
interface WebSocketMessage {
  type: 'agent_metrics_update' | 'agent_status_change' | 'agent_task_update' | 'agent_error' | 'system_health_update';
  timestamp: string;
  data: any;
}

interface SubscriptionMessage {
  type: 'subscribe_agent' | 'unsubscribe_agent' | 'subscribe_system' | 'agent_action';
  data: any;
}
```

## 🔒 Authentication & Authorization

### API Authentication
All API endpoints require authentication using JWT tokens:

```http
Authorization: Bearer <jwt_token>
```

### WebSocket Authentication
WebSocket connections authenticate during the handshake:

```javascript
const ws = new WebSocket('ws://localhost:4000/api/v1/stream/performance', {
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
});
```

### Permission Levels
- **Read**: View agent performance data
- **Monitor**: Subscribe to real-time updates
- **Control**: Send control commands to agents
- **Admin**: Access system-wide metrics and alerts

## 🚨 Error Handling

### HTTP Error Responses
```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent with ID 'agent-001' not found",
    "details": {
      "agentId": "agent-001",
      "timestamp": "2025-07-16T18:09:05.123Z"
    }
  }
}
```

### WebSocket Error Messages
```json
{
  "type": "error",
  "timestamp": "2025-07-16T18:09:05.123Z",
  "error": {
    "code": "SUBSCRIPTION_FAILED",
    "message": "Failed to subscribe to agent updates",
    "details": {
      "agentId": "agent-001",
      "reason": "Agent not found"
    }
  }
}
```

### Common Error Codes
- `AGENT_NOT_FOUND`: Requested agent does not exist
- `INVALID_PARAMETERS`: Request parameters are invalid
- `SUBSCRIPTION_FAILED`: WebSocket subscription failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions

## 📈 Rate Limiting

### REST API Limits
- **Standard**: 1000 requests per hour per API key
- **Burst**: 100 requests per minute
- **Agent-specific endpoints**: 500 requests per hour per agent

### WebSocket Limits
- **Connections**: 10 concurrent connections per user
- **Subscriptions**: 50 agent subscriptions per connection
- **Message rate**: 100 messages per minute per connection

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
API_PORT=4000
API_HOST=localhost
API_VERSION=v1

# Database
DB_CONNECTION_STRING=postgresql://user:pass@localhost:5432/agent_db

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=1000
WS_MESSAGE_QUEUE_SIZE=10000

# Performance Monitoring
METRICS_UPDATE_INTERVAL=1000
TREND_CALCULATION_WINDOW=3600000
PERFORMANCE_SCORE_ALGORITHM=weighted_average

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=24h
```

### API Configuration Object
```typescript
interface ApiConfiguration {
  updateIntervals: {
    metrics: number; // milliseconds
    trends: number; // milliseconds
    health: number; // milliseconds
  };
  thresholds: {
    performance: {
      excellent: number; // >95
      good: number; // >85
      fair: number; // >70
      poor: number; // <=70
    };
    latency: {
      excellent: number; // <100ms
      good: number; // <500ms
      fair: number; // <1000ms
      poor: number; // >=1000ms
    };
  };
  caching: {
    ttl: number; // seconds
    maxEntries: number;
  };
}
```

---

**This API specification provides complete documentation for integrating with the Agent Performance Dashboard Cards, enabling robust real-time monitoring and control of AI agent systems.**