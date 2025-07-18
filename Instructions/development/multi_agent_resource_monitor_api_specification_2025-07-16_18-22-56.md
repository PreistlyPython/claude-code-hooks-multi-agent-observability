# 🔌 Multi-Agent Resource Monitor - API Specification
*RESTful API & WebSocket Protocol for Real-time Resource Monitoring*

**Version**: 1.0  
**Date**: 2025-07-16 18:22:56  
**Protocol**: REST API + WebSocket Streaming  
**Authentication**: JWT Bearer Token  
**Base URL**: `http://localhost:3001/api`  
**WebSocket URL**: `ws://localhost:3001/resource-monitor`  

## 📋 API Overview

The Multi-Agent Resource Monitor API provides comprehensive endpoints for real-time resource monitoring, historical data access, threshold management, and system configuration. The API follows RESTful principles with WebSocket streaming for real-time updates.

### **Core Principles**
- **Real-time First**: WebSocket for live data, REST for configuration
- **Performance Optimized**: Minimal latency for critical monitoring data
- **Scalable Architecture**: Designed to handle 1000+ concurrent agents
- **Security Focused**: JWT authentication with role-based access control

## 🔐 Authentication & Authorization

### **JWT Authentication**
```http
Authorization: Bearer <jwt_token>
```

**Token Structure:**
```json
{
  "sub": "user_id",
  "role": "admin|operator|viewer",
  "permissions": ["read:metrics", "write:thresholds", "admin:system"],
  "exp": 1642723200,
  "iat": 1642636800
}
```

### **Role-based Access Control**
- **Admin**: Full access to all endpoints and system configuration
- **Operator**: Read/write access to metrics and thresholds
- **Viewer**: Read-only access to monitoring data

## 🏗️ REST API Endpoints

### **1. Agent Management**

#### **GET /api/agents**
Retrieve list of all registered agents with current status.

**Request:**
```http
GET /api/agents
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by agent status (`active|idle|busy|error|offline`)
- `limit` (optional): Maximum number of agents to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "agent_id": "agent_001",
        "name": "Data Processing Agent",
        "status": "active",
        "last_seen": "2025-07-16T18:22:56.000Z",
        "uptime_seconds": 3600,
        "version": "1.2.3",
        "capabilities": ["data_processing", "api_calls", "file_operations"],
        "resource_limits": {
          "cpu_cores": 3.0,
          "memory_mb": 1024,
          "api_requests_per_minute": 100
        }
      }
    ],
    "total_count": 85,
    "active_count": 72,
    "error_count": 2,
    "offline_count": 11
  },
  "timestamp": "2025-07-16T18:22:56.000Z"
}
```

---

#### **GET /api/agents/:agentId**
Retrieve detailed information about a specific agent.

**Request:**
```http
GET /api/agents/agent_001
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agent_id": "agent_001",
    "name": "Data Processing Agent",
    "status": "active",
    "last_seen": "2025-07-16T18:22:56.000Z",
    "uptime_seconds": 3600,
    "version": "1.2.3",
    "host_info": {
      "hostname": "worker-node-01",
      "platform": "linux",
      "architecture": "x64",
      "node_version": "18.17.0"
    },
    "capabilities": ["data_processing", "api_calls", "file_operations"],
    "resource_limits": {
      "cpu_cores": 3.0,
      "memory_mb": 1024,
      "api_requests_per_minute": 100,
      "concurrent_operations": 10
    },
    "current_metrics": {
      "cpu_usage_percent": 78.5,
      "memory_usage_percent": 65.2,
      "api_requests_used": 45,
      "queue_depth": 3
    }
  },
  "timestamp": "2025-07-16T18:22:56.000Z"
}
```

---

### **2. Resource Metrics**

#### **GET /api/agents/:agentId/metrics**
Retrieve historical resource metrics for a specific agent.

**Request:**
```http
GET /api/agents/agent_001/metrics?timeRange=1h&interval=1m
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeRange`: Time range for historical data (`5m|15m|1h|6h|24h|7d`)
- `interval`: Data point interval (`1s|10s|1m|5m|15m|1h`)
- `metrics`: Comma-separated list of metrics (`cpu,memory,api,queue`)

**Response:**
```json
{
  "success": true,
  "data": {
    "agent_id": "agent_001",
    "time_range": "1h",
    "interval": "1m",
    "data_points": [
      {
        "timestamp": "2025-07-16T17:22:56.000Z",
        "cpu": {
          "usage_percent": 75.2,
          "cores_used": 2.26,
          "load_average": [1.2, 1.5, 1.8]
        },
        "memory": {
          "used_mb": 512,
          "usage_percent": 50.0,
          "heap_size_mb": 384,
          "gc_events": 2
        },
        "api": {
          "requests_used": 42,
          "rate_per_minute": 85,
          "tokens_consumed": 420,
          "error_rate_percent": 2.1
        },
        "queue": {
          "pending_operations": 3,
          "active_operations": 7,
          "avg_wait_time_ms": 1200,
          "throughput_per_minute": 45
        }
      }
    ]
  },
  "timestamp": "2025-07-16T18:22:56.000Z"
}
```

---

#### **POST /api/agents/:agentId/metrics**
Submit resource metrics for a specific agent (used by agents to report their status).

**Request:**
```http
POST /api/agents/agent_001/metrics
Authorization: Bearer <token>
Content-Type: application/json

{
  "timestamp": "2025-07-16T18:22:56.000Z",
  "cpu": {
    "usage_percent": 78.5,
    "cores_used": 2.36,
    "cores_total": 3.0,
    "load_average": [1.4, 1.6, 1.9],
    "throttling_count": 0
  },
  "memory": {
    "used_mb": 668,
    "total_mb": 1024,
    "usage_percent": 65.2,
    "available_mb": 356,
    "gc_events": 1,
    "heap_size_mb": 512
  },
  "api": {
    "requests_used": 45,
    "requests_limit": 100,
    "rate_per_minute": 85,
    "tokens_consumed": 450,
    "estimated_cost": 0.0090,
    "throttle_events": 0,
    "error_rate_percent": 2.1,
    "avg_response_time_ms": 245
  },
  "queue": {
    "pending_operations": 3,
    "concurrent_limit": 10,
    "active_operations": 7,
    "avg_wait_time_ms": 1200,
    "throughput_per_minute": 45,
    "failed_operations": 1
  },
  "status": {
    "state": "busy",
    "last_activity": "2025-07-16T18:22:55.000Z",
    "uptime_seconds": 3661,
    "version": "1.2.3"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agent_id": "agent_001",
    "metrics_received": true,
    "processed_at": "2025-07-16T18:22:56.000Z",
    "next_report_due": "2025-07-16T18:23:56.000Z"
  }
}
```

---

### **3. System Overview**

#### **GET /api/system/overview**
Retrieve system-wide resource metrics and agent statistics.

**Request:**
```http
GET /api/system/overview
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cpu": {
      "usage_percent": 68.4,
      "cores_used": 82.1,
      "cores_available": 120.0,
      "agent_count": 40
    },
    "total_memory": {
      "used_gb": 28.5,
      "total_gb": 48.0,
      "usage_percent": 59.4,
      "agents_using_memory": 38
    },
    "api_usage": {
      "total_requests": 3840,
      "total_limit": 4000,
      "total_cost": 0.768,
      "highest_usage_agent": "agent_027"
    },
    "queue_status": {
      "total_pending": 89,
      "total_active": 156,
      "system_throughput": 1250,
      "bottleneck_agent": "agent_015"
    },
    "agents": {
      "total_count": 40,
      "active_count": 36,
      "idle_count": 2,
      "error_count": 1,
      "offline_count": 1
    },
    "alerts": {
      "warning_count": 3,
      "critical_count": 1,
      "emergency_count": 0
    }
  },
  "timestamp": "2025-07-16T18:22:56.000Z"
}
```

---

### **4. Threshold Management**

#### **GET /api/thresholds**
Retrieve all threshold configurations.

**Request:**
```http
GET /api/thresholds
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "global_thresholds": [
      {
        "metric_type": "cpu",
        "thresholds": {
          "warning": { "value": 75, "color": "#FBB040", "notify": true },
          "critical": { "value": 90, "color": "#E53E3E", "notify": true },
          "emergency": { "value": 95, "color": "#C53030", "notify": true }
        },
        "hysteresis": {
          "warning_clear": 70,
          "critical_clear": 85
        }
      }
    ],
    "agent_specific_thresholds": [
      {
        "agent_id": "agent_001",
        "metric_type": "memory",
        "thresholds": {
          "warning": { "value": 80, "color": "#FBB040", "notify": true },
          "critical": { "value": 95, "color": "#E53E3E", "notify": true }
        }
      }
    ]
  },
  "timestamp": "2025-07-16T18:22:56.000Z"
}
```

---

#### **PUT /api/thresholds**
Update threshold configurations.

**Request:**
```http
PUT /api/thresholds
Authorization: Bearer <token>
Content-Type: application/json

{
  "metric_type": "cpu",
  "agent_id": null,
  "thresholds": {
    "warning": { "value": 80, "color": "#FBB040", "notify": true },
    "critical": { "value": 90, "color": "#E53E3E", "notify": true },
    "emergency": { "value": 95, "color": "#C53030", "notify": true }
  },
  "hysteresis": {
    "warning_clear": 75,
    "critical_clear": 85
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "threshold_updated": true,
    "metric_type": "cpu",
    "agent_id": null,
    "updated_at": "2025-07-16T18:22:56.000Z"
  }
}
```

---

### **5. Alert Management**

#### **GET /api/alerts**
Retrieve current and historical alerts.

**Request:**
```http
GET /api/alerts?status=active&timeRange=24h&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by alert status (`active|resolved|acknowledged`)
- `severity`: Filter by severity (`warning|critical|emergency`)
- `agent_id`: Filter by specific agent
- `timeRange`: Time range for historical alerts
- `limit`: Maximum number of alerts to return

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "alert_id": "alert_12345",
        "agent_id": "agent_001",
        "metric_type": "cpu",
        "severity": "critical",
        "current_value": 92.5,
        "threshold_value": 90.0,
        "status": "active",
        "created_at": "2025-07-16T18:20:30.000Z",
        "updated_at": "2025-07-16T18:22:56.000Z",
        "message": "CPU usage exceeded critical threshold",
        "suggested_actions": [
          "Scale up agent resources",
          "Reduce concurrent operations",
          "Check for resource leaks"
        ]
      }
    ],
    "total_count": 127,
    "active_count": 4,
    "resolved_count": 123
  },
  "timestamp": "2025-07-16T18:22:56.000Z"
}
```

---

#### **POST /api/alerts/:alertId/acknowledge**
Acknowledge an active alert.

**Request:**
```http
POST /api/alerts/alert_12345/acknowledge
Authorization: Bearer <token>
Content-Type: application/json

{
  "acknowledged_by": "user_id",
  "comment": "Investigating CPU spike on agent_001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alert_id": "alert_12345",
    "status": "acknowledged",
    "acknowledged_by": "user_id",
    "acknowledged_at": "2025-07-16T18:22:56.000Z"
  }
}
```

---

## 🔄 WebSocket Protocol

### **Connection Establishment**
```javascript
const ws = new WebSocket('ws://localhost:3001/resource-monitor?token=jwt_token');
```

### **Message Types**

#### **1. Subscription Management**

**Subscribe to Specific Agents:**
```json
{
  "type": "subscribe",
  "data": {
    "agents": ["agent_001", "agent_002"],
    "metrics": ["cpu", "memory", "api", "queue"],
    "update_frequency": 1000
  }
}
```

**Subscribe to All Agents:**
```json
{
  "type": "subscribe_all",
  "data": {
    "metrics": ["cpu", "memory"],
    "update_frequency": 5000
  }
}
```

---

#### **2. Real-time Data Streams**

**Resource Update Message:**
```json
{
  "type": "resource_update",
  "timestamp": "2025-07-16T18:22:56.000Z",
  "data": {
    "agent_id": "agent_001",
    "cpu": {
      "usage_percent": 78.5,
      "cores_used": 2.36,
      "trend": [75, 76, 78, 77, 78.5]
    },
    "memory": {
      "used_mb": 512,
      "usage_percent": 50.0,
      "trend": [48, 49, 51, 50, 50]
    },
    "api": {
      "requests_used": 45,
      "rate_per_minute": 85,
      "tokens_consumed": 450,
      "estimated_cost": 0.0090
    },
    "queue": {
      "pending_operations": 3,
      "active_operations": 7,
      "avg_wait_time_ms": 1200
    }
  }
}
```

**System Overview Update:**
```json
{
  "type": "system_overview",
  "timestamp": "2025-07-16T18:22:56.000Z",
  "data": {
    "total_cpu_percent": 68.4,
    "total_memory_percent": 59.4,
    "total_api_usage": 3840,
    "total_queue_depth": 89,
    "agent_counts": {
      "active": 36,
      "idle": 2,
      "error": 1,
      "offline": 1
    }
  }
}
```

**Threshold Alert:**
```json
{
  "type": "threshold_alert",
  "timestamp": "2025-07-16T18:22:56.000Z",
  "data": {
    "alert_id": "alert_12345",
    "agent_id": "agent_001",
    "metric_type": "cpu",
    "severity": "critical",
    "current_value": 92.5,
    "threshold_value": 90.0,
    "message": "CPU usage exceeded critical threshold",
    "suggested_actions": [
      "Scale up agent resources",
      "Reduce concurrent operations"
    ]
  }
}
```

**Agent Status Change:**
```json
{
  "type": "agent_status",
  "timestamp": "2025-07-16T18:22:56.000Z",
  "data": {
    "agent_id": "agent_001",
    "previous_status": "active",
    "current_status": "error",
    "reason": "Connection timeout",
    "last_seen": "2025-07-16T18:20:30.000Z"
  }
}
```

---

#### **3. Connection Management**

**Keep-alive (Heartbeat):**
```json
{
  "type": "ping",
  "timestamp": "2025-07-16T18:22:56.000Z"
}
```

**Server Response:**
```json
{
  "type": "pong",
  "timestamp": "2025-07-16T18:22:56.000Z"
}
```

**Error Handling:**
```json
{
  "type": "error",
  "timestamp": "2025-07-16T18:22:56.000Z",
  "data": {
    "code": "SUBSCRIPTION_FAILED",
    "message": "Agent agent_999 not found",
    "details": {
      "agent_id": "agent_999",
      "error_type": "not_found"
    }
  }
}
```

---

## 📊 Performance & Rate Limiting

### **Rate Limits**
- **REST API**: 1000 requests per minute per user
- **WebSocket**: 100 messages per second per connection
- **Metric Submission**: 10 reports per second per agent

### **Response Time Targets**
- **REST API**: <100ms for simple queries, <500ms for complex aggregations
- **WebSocket**: <50ms message processing time
- **Real-time Updates**: <1 second end-to-end latency

### **Data Retention**
- **Real-time Metrics**: 1 hour of high-frequency data
- **Historical Data**: 7 days of minute-level aggregated data
- **Alert History**: 30 days of alert records

## 🔒 Security Considerations

### **Authentication**
- JWT tokens with 1-hour expiration
- Refresh token mechanism for long-running connections
- Role-based access control for data visibility

### **Data Validation**
- Strict input validation for all metric submissions
- Rate limiting to prevent data flooding
- Sanitization of all user-provided data

### **Privacy & Compliance**
- No sensitive data (credentials, keys) in metric payloads
- Audit logging for all API access
- Data retention policies for compliance

## 🧪 Testing Endpoints

### **Health Check**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-16T18:22:56.000Z",
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "active_connections": 45,
  "metrics_processed_last_minute": 2340
}
```

### **API Performance Metrics**
```http
GET /api/internal/metrics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "api_metrics": {
    "requests_per_second": 145.2,
    "avg_response_time_ms": 78,
    "error_rate_percent": 0.1,
    "active_websocket_connections": 45
  },
  "system_metrics": {
    "cpu_usage_percent": 23.5,
    "memory_usage_mb": 512,
    "database_connections": 10
  }
}
```

---

**This API specification provides a comprehensive foundation for building a robust, scalable, and secure Multi-Agent Resource Monitor with real-time capabilities and enterprise-grade performance.**