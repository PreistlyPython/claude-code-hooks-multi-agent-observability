# 🛠️ Multi-Agent Resource Monitor - Implementation Guide
*Step-by-Step Development with Proven Patterns*

**Version**: 1.0  
**Date**: 2025-07-16 18:22:56  
**Stack**: Vue 3 + TypeScript + Chart.js + WebSocket + Node.js  
**Estimated Timeline**: 8 weeks (4 phases × 2 weeks each)  
**Complexity**: Medium  

## 🎯 Implementation Overview

This guide provides a comprehensive, step-by-step implementation plan for the Multi-Agent Resource Monitor, leveraging proven patterns from industry leaders and optimized for the existing Vue 3 + TypeScript codebase.

### **Implementation Philosophy**
- **Iterative Development**: Build core functionality first, enhance progressively
- **Performance First**: Optimize for real-time updates and scalability
- **User-Centered**: Implement features based on validated user stories
- **Quality Assurance**: Comprehensive testing throughout development

## 📋 Prerequisites & Environment Setup

### **Required Dependencies**
```bash
# Frontend Dependencies (Vue 3 Client)
npm install chart.js vue-chartjs ws
npm install -D @types/ws vitest @vue/test-utils jsdom

# Backend Dependencies (if extending server)
npm install ws jsonwebtoken express-rate-limit helmet
npm install -D @types/jsonwebtoken @types/ws
```

### **Development Environment**
```bash
# Project Structure Verification
apps/
├── client/                 # Vue 3 Frontend
│   ├── src/
│   │   ├── components/    # Dashboard components
│   │   ├── composables/   # Vue composition API logic
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Utility functions
└── server/                # Node.js Backend
    ├── src/
    │   ├── websocket/     # WebSocket server logic
    │   ├── api/           # REST API endpoints
    └── types/             # Shared type definitions
```

## 🏗️ Phase 1: Core Infrastructure (Week 1-2)

### **Step 1.1: Type Definitions & Interfaces**

**Create Core Types** (`apps/client/src/types/resource-monitoring.ts`):
```typescript
// Resource Monitoring Types
export interface AgentResourceMetrics {
  agent_id: string
  timestamp: string
  
  cpu: {
    usage_percent: number
    cores_used: number
    cores_total: number
    load_average: number[]
    trend_data: number[]
    throttling_count: number
  }
  
  memory: {
    used_mb: number
    total_mb: number
    usage_percent: number
    available_mb: number
    trend_data: number[]
    gc_events: number
    heap_size_mb: number
  }
  
  api: {
    requests_used: number
    requests_limit: number
    rate_per_minute: number
    tokens_consumed: number
    estimated_cost: number
    throttle_events: number
    error_rate_percent: number
    avg_response_time_ms: number
  }
  
  queue: {
    pending_operations: number
    concurrent_limit: number
    active_operations: number
    avg_wait_time_ms: number
    throughput_per_minute: number
    failed_operations: number
    queue_overflow_count: number
  }
  
  status: {
    state: 'active' | 'idle' | 'busy' | 'error' | 'offline'
    last_activity: string
    uptime_seconds: number
    error_message?: string
    version: string
  }
}

export interface SystemOverviewMetrics {
  timestamp: string
  total_cpu: {
    usage_percent: number
    cores_used: number
    cores_available: number
    agent_count: number
  }
  total_memory: {
    used_gb: number
    total_gb: number
    usage_percent: number
    agents_using_memory: number
  }
  api_usage: {
    total_requests: number
    total_limit: number
    total_cost: number
    highest_usage_agent: string
  }
  queue_status: {
    total_pending: number
    total_active: number
    system_throughput: number
    bottleneck_agent?: string
  }
  agents: {
    total_count: number
    active_count: number
    idle_count: number
    error_count: number
    offline_count: number
  }
}

export interface ThresholdConfig {
  metric_type: 'cpu' | 'memory' | 'api_rate' | 'queue_depth'
  agent_id?: string
  thresholds: {
    warning: { value: number; color: string; notify: boolean }
    critical: { value: number; color: string; notify: boolean }
    emergency: { value: number; color: string; notify: boolean }
  }
  hysteresis: {
    warning_clear: number
    critical_clear: number
  }
}

export type AlertLevel = 'normal' | 'warning' | 'critical' | 'emergency'

export interface ThresholdAlert {
  alert_id: string
  agent_id: string
  metric_type: string
  severity: AlertLevel
  current_value: number
  threshold_value: number
  timestamp: string
  message: string
  suggested_actions: string[]
}
```

### **Step 1.2: WebSocket Connection Management**

**Create WebSocket Composable** (`apps/client/src/composables/useWebSocketConnection.ts`):
```typescript
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { AgentResourceMetrics, SystemOverviewMetrics, ThresholdAlert } from '@/types/resource-monitoring'

export function useWebSocketConnection(url: string, token: string) {
  const ws = ref<WebSocket | null>(null)
  const connectionStatus = ref<'connected' | 'connecting' | 'disconnected'>('disconnected')
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 10
  const reconnectDelay = ref(1000)
  
  // Event handlers
  const messageHandlers = new Map<string, (data: any) => void>()
  
  // Connection management
  const connect = () => {
    connectionStatus.value = 'connecting'
    
    try {
      ws.value = new WebSocket(`${url}?token=${token}`)
      
      ws.value.onopen = () => {
        connectionStatus.value = 'connected'
        reconnectAttempts.value = 0
        reconnectDelay.value = 1000
        console.log('WebSocket connected')
      }
      
      ws.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          const handler = messageHandlers.get(message.type)
          if (handler) {
            handler(message.data)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      ws.value.onclose = () => {
        connectionStatus.value = 'disconnected'
        console.log('WebSocket disconnected')
        attemptReconnect()
      }
      
      ws.value.onerror = (error) => {
        console.error('WebSocket error:', error)
        connectionStatus.value = 'disconnected'
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      connectionStatus.value = 'disconnected'
    }
  }
  
  const attemptReconnect = () => {
    if (reconnectAttempts.value < maxReconnectAttempts) {
      reconnectAttempts.value++
      console.log(`Attempting reconnect ${reconnectAttempts.value}/${maxReconnectAttempts}`)
      
      setTimeout(() => {
        connect()
      }, reconnectDelay.value)
      
      // Exponential backoff
      reconnectDelay.value = Math.min(reconnectDelay.value * 1.5, 30000)
    }
  }
  
  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }
  
  const sendMessage = (type: string, data: any) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type, data }))
    }
  }
  
  const onMessage = (type: string, handler: (data: any) => void) => {
    messageHandlers.set(type, handler)
  }
  
  const subscribe = (agents: string[], metrics: string[], updateFrequency = 1000) => {
    sendMessage('subscribe', {
      agents,
      metrics,
      update_frequency: updateFrequency
    })
  }
  
  const subscribeAll = (metrics: string[], updateFrequency = 5000) => {
    sendMessage('subscribe_all', {
      metrics,
      update_frequency: updateFrequency
    })
  }
  
  // Lifecycle
  onMounted(() => {
    connect()
  })
  
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    connectionStatus: computed(() => connectionStatus.value),
    reconnectAttempts: computed(() => reconnectAttempts.value),
    connect,
    disconnect,
    sendMessage,
    onMessage,
    subscribe,
    subscribeAll
  }
}
```

### **Step 1.3: Basic Dashboard Layout**

**Create Main Dashboard Component** (`apps/client/src/components/ResourceMonitorDashboard.vue`):
```vue
<template>
  <div class="resource-monitor-dashboard">
    <!-- Header with Connection Status -->
    <div class="dashboard-header">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Multi-Agent Resource Monitor
      </h1>
      <div class="connection-status">
        <div 
          :class="connectionStatusClass"
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
        >
          <div class="w-2 h-2 mr-2 rounded-full" :class="connectionDotClass"></div>
          {{ connectionStatus }}
        </div>
      </div>
    </div>
    
    <!-- System Overview Panel -->
    <SystemOverviewPanel 
      v-if="systemOverview"
      :data="systemOverview"
      class="mb-6"
    />
    
    <!-- Agent Grid -->
    <div class="agent-grid">
      <AgentResourceCard
        v-for="agent in agents"
        :key="agent.agent_id"
        :data="agent"
        :thresholds="getAgentThresholds(agent.agent_id)"
        @alert="handleAlert"
      />
    </div>
    
    <!-- Loading State -->
    <div v-if="agents.length === 0" class="loading-state">
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Loading agent data...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWebSocketConnection } from '@/composables/useWebSocketConnection'
import SystemOverviewPanel from './SystemOverviewPanel.vue'
import AgentResourceCard from './AgentResourceCard.vue'
import type { AgentResourceMetrics, SystemOverviewMetrics, ThresholdAlert, ThresholdConfig } from '@/types/resource-monitoring'

// WebSocket connection
const { connectionStatus, onMessage, subscribeAll } = useWebSocketConnection(
  'ws://localhost:3001/resource-monitor',
  'your-jwt-token' // Replace with actual token management
)

// Reactive state
const agents = ref<AgentResourceMetrics[]>([])
const systemOverview = ref<SystemOverviewMetrics | null>(null)
const thresholds = ref<ThresholdConfig[]>([])
const alerts = ref<ThresholdAlert[]>([])

// Computed properties
const connectionStatusClass = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'connecting':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
})

const connectionDotClass = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'bg-green-400'
    case 'connecting':
      return 'bg-yellow-400 animate-pulse'
    default:
      return 'bg-red-400'
  }
})

// Methods
const getAgentThresholds = (agentId: string): ThresholdConfig[] => {
  return thresholds.value.filter(t => 
    t.agent_id === agentId || t.agent_id === undefined
  )
}

const handleAlert = (alert: ThresholdAlert) => {
  alerts.value.push(alert)
  
  // Show browser notification for critical alerts
  if (alert.severity === 'critical' || alert.severity === 'emergency') {
    showNotification(alert)
  }
}

const showNotification = (alert: ThresholdAlert) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`${alert.severity.toUpperCase()}: ${alert.message}`, {
      body: `Agent ${alert.agent_id}: ${alert.metric_type} at ${alert.current_value}%`,
      icon: '/favicon.ico'
    })
  }
}

const updateAgent = (agentData: AgentResourceMetrics) => {
  const index = agents.value.findIndex(a => a.agent_id === agentData.agent_id)
  if (index >= 0) {
    agents.value[index] = agentData
  } else {
    agents.value.push(agentData)
  }
}

// WebSocket message handlers
onMessage('resource_update', updateAgent)
onMessage('system_overview', (data: SystemOverviewMetrics) => {
  systemOverview.value = data
})
onMessage('threshold_alert', handleAlert)

// Initialize
onMounted(() => {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
  
  // Subscribe to all agents
  subscribeAll(['cpu', 'memory', 'api', 'queue'])
})
</script>

<style scoped>
.resource-monitor-dashboard {
  @apply p-6 max-w-7xl mx-auto;
}

.dashboard-header {
  @apply flex justify-between items-center mb-6;
}

.agent-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}

.loading-state {
  @apply col-span-full;
}
</style>
```

### **Step 1.4: Testing Infrastructure**

**Setup Testing Environment** (`apps/client/src/composables/__tests__/useWebSocketConnection.test.ts`):
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useWebSocketConnection } from '../useWebSocketConnection'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  
  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  
  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 10)
  }
  
  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  })
}

global.WebSocket = MockWebSocket as any

describe('useWebSocketConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('establishes connection successfully', async () => {
    const { connectionStatus } = useWebSocketConnection('ws://test', 'token')
    
    expect(connectionStatus.value).toBe('connecting')
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(connectionStatus.value).toBe('connected')
  })
  
  it('handles message subscription', async () => {
    const { subscribe } = useWebSocketConnection('ws://test', 'token')
    
    await new Promise(resolve => setTimeout(resolve, 20))
    
    subscribe(['agent1'], ['cpu', 'memory'], 1000)
    
    expect(MockWebSocket.prototype.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'subscribe',
        data: {
          agents: ['agent1'],
          metrics: ['cpu', 'memory'],
          update_frequency: 1000
        }
      })
    )
  })
})
```

## 🎨 Phase 2: Core Components (Week 3-4)

### **Step 2.1: Agent Resource Card Component**

**Create Agent Card** (`apps/client/src/components/AgentResourceCard.vue`):
```vue
<template>
  <div class="agent-resource-card" :class="cardStatusClass">
    <!-- Card Header -->
    <div class="card-header">
      <div class="agent-info">
        <h3 class="agent-name">{{ data.agent_id }}</h3>
        <div class="agent-status" :class="statusClass">
          {{ data.status.state }}
        </div>
      </div>
      <div class="last-updated">
        {{ formatTime(data.timestamp) }}
      </div>
    </div>
    
    <!-- Resource Metrics -->
    <div class="metrics-grid">
      <!-- CPU Usage -->
      <div class="metric-item">
        <div class="metric-header">
          <span class="metric-label">CPU</span>
          <span class="metric-value">{{ data.cpu.usage_percent.toFixed(1) }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${data.cpu.usage_percent}%` }"
            :class="getThresholdClass('cpu', data.cpu.usage_percent)"
          ></div>
        </div>
        <SparklineChart
          :data="data.cpu.trend_data"
          :color="getThresholdColor('cpu', data.cpu.usage_percent)"
          class="mt-2"
        />
        <div class="metric-details">
          {{ data.cpu.cores_used.toFixed(2) }}/{{ data.cpu.cores_total }} cores
        </div>
      </div>
      
      <!-- Memory Usage -->
      <div class="metric-item">
        <div class="metric-header">
          <span class="metric-label">Memory</span>
          <span class="metric-value">{{ data.memory.usage_percent.toFixed(1) }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${data.memory.usage_percent}%` }"
            :class="getThresholdClass('memory', data.memory.usage_percent)"
          ></div>
        </div>
        <SparklineChart
          :data="data.memory.trend_data"
          :color="getThresholdColor('memory', data.memory.usage_percent)"
          class="mt-2"
        />
        <div class="metric-details">
          {{ formatBytes(data.memory.used_mb * 1024 * 1024) }}/{{ formatBytes(data.memory.total_mb * 1024 * 1024) }}
        </div>
      </div>
      
      <!-- API Usage -->
      <div class="metric-item">
        <div class="metric-header">
          <span class="metric-label">API</span>
          <span class="metric-value">{{ ((data.api.requests_used / data.api.requests_limit) * 100).toFixed(1) }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${(data.api.requests_used / data.api.requests_limit) * 100}%` }"
            :class="getThresholdClass('api_rate', (data.api.requests_used / data.api.requests_limit) * 100)"
          ></div>
        </div>
        <div class="metric-details">
          {{ data.api.requests_used }}/{{ data.api.requests_limit }} req
          <span class="cost-info">(${{ data.api.estimated_cost.toFixed(4) }})</span>
        </div>
      </div>
      
      <!-- Queue Status -->
      <div class="metric-item">
        <div class="metric-header">
          <span class="metric-label">Queue</span>
          <span class="metric-value">{{ data.queue.pending_operations }}</span>
        </div>
        <div class="queue-info">
          <div class="queue-detail">
            <span class="label">Active:</span>
            <span class="value">{{ data.queue.active_operations }}/{{ data.queue.concurrent_limit }}</span>
          </div>
          <div class="queue-detail">
            <span class="label">Wait:</span>
            <span class="value">{{ formatDuration(data.queue.avg_wait_time_ms) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SparklineChart from './SparklineChart.vue'
import type { AgentResourceMetrics, ThresholdConfig, AlertLevel } from '@/types/resource-monitoring'

interface Props {
  data: AgentResourceMetrics
  thresholds: ThresholdConfig[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  alert: [alert: any]
}>()

// Computed properties
const cardStatusClass = computed(() => {
  switch (props.data.status.state) {
    case 'active':
      return 'border-green-200 bg-white'
    case 'busy':
      return 'border-yellow-200 bg-yellow-50'
    case 'error':
      return 'border-red-200 bg-red-50'
    case 'offline':
      return 'border-gray-200 bg-gray-50'
    default:
      return 'border-gray-200 bg-white'
  }
})

const statusClass = computed(() => {
  switch (props.data.status.state) {
    case 'active':
      return 'text-green-600 bg-green-100'
    case 'busy':
      return 'text-yellow-600 bg-yellow-100'
    case 'error':
      return 'text-red-600 bg-red-100'
    case 'offline':
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
})

// Utility methods
const getThresholdLevel = (metricType: string, value: number): AlertLevel => {
  const threshold = props.thresholds.find(t => t.metric_type === metricType)
  if (!threshold) return 'normal'
  
  if (value >= threshold.thresholds.emergency.value) return 'emergency'
  if (value >= threshold.thresholds.critical.value) return 'critical'
  if (value >= threshold.thresholds.warning.value) return 'warning'
  return 'normal'
}

const getThresholdClass = (metricType: string, value: number): string => {
  const level = getThresholdLevel(metricType, value)
  switch (level) {
    case 'emergency':
      return 'bg-red-600'
    case 'critical':
      return 'bg-red-500'
    case 'warning':
      return 'bg-yellow-500'
    default:
      return 'bg-green-500'
  }
}

const getThresholdColor = (metricType: string, value: number): string => {
  const level = getThresholdLevel(metricType, value)
  switch (level) {
    case 'emergency':
      return '#DC2626'
    case 'critical':
      return '#EF4444'
    case 'warning':
      return '#F59E0B'
    default:
      return '#10B981'
  }
}

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const formatBytes = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
</script>

<style scoped>
.agent-resource-card {
  @apply border rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md;
}

.card-header {
  @apply flex justify-between items-start mb-4;
}

.agent-info {
  @apply flex flex-col;
}

.agent-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.agent-status {
  @apply px-2 py-1 rounded-full text-xs font-medium mt-1 w-fit;
}

.last-updated {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.metrics-grid {
  @apply space-y-4;
}

.metric-item {
  @apply space-y-2;
}

.metric-header {
  @apply flex justify-between items-center;
}

.metric-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.metric-value {
  @apply text-sm font-bold text-gray-900 dark:text-white;
}

.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700;
}

.progress-fill {
  @apply h-2 rounded-full transition-all duration-300;
}

.metric-details {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.cost-info {
  @apply text-green-600 dark:text-green-400 ml-2;
}

.queue-info {
  @apply space-y-1;
}

.queue-detail {
  @apply flex justify-between text-xs;
}

.queue-detail .label {
  @apply text-gray-600 dark:text-gray-400;
}

.queue-detail .value {
  @apply text-gray-900 dark:text-white font-medium;
}
</style>
```

### **Step 2.2: Sparkline Chart Component**

**Create Sparkline Chart** (`apps/client/src/components/SparklineChart.vue`):
```vue
<template>
  <div class="sparkline-container">
    <canvas 
      ref="chartCanvas"
      :width="width"
      :height="height"
      class="sparkline-chart"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, type ChartConfiguration } from 'chart.js'

// Register Chart.js components
Chart.register(LineElement, PointElement, LinearScale, CategoryScale)

interface Props {
  data: number[]
  color?: string
  width?: number
  height?: number
  min?: number
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: '#3B82F6',
  width: 200,
  height: 60,
  min: 0,
  max: 100
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return
  
  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels: props.data.map((_, index) => index),
      datasets: [{
        data: props.data,
        borderColor: props.color,
        backgroundColor: `${props.color}20`,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          display: false,
          grid: { display: false }
        },
        y: {
          display: false,
          grid: { display: false },
          min: props.min,
          max: props.max
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      elements: {
        point: { radius: 0 }
      },
      animation: {
        duration: 200,
        easing: 'linear'
      }
    }
  }
  
  chart = new Chart(chartCanvas.value, config)
}

const updateChart = () => {
  if (!chart) return
  
  chart.data.datasets[0].data = props.data
  chart.data.datasets[0].borderColor = props.color
  chart.data.datasets[0].backgroundColor = `${props.color}20`
  chart.update('none') // No animation for real-time updates
}

const destroyChart = () => {
  if (chart) {
    chart.destroy()
    chart = null
  }
}

// Watchers
watch(() => props.data, updateChart, { deep: true })
watch(() => props.color, updateChart)

// Lifecycle
onMounted(() => {
  createChart()
})

onUnmounted(() => {
  destroyChart()
})
</script>

<style scoped>
.sparkline-container {
  @apply relative;
}

.sparkline-chart {
  @apply block;
}
</style>
```

### **Step 2.3: System Overview Panel**

**Create System Overview** (`apps/client/src/components/SystemOverviewPanel.vue`):
```vue
<template>
  <div class="system-overview-panel">
    <h2 class="panel-title">System Overview</h2>
    
    <div class="overview-grid">
      <!-- Total CPU -->
      <div class="overview-item">
        <div class="item-header">
          <span class="item-label">Total CPU</span>
          <span class="item-value">{{ data.total_cpu.usage_percent.toFixed(1) }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill bg-blue-500"
            :style="{ width: `${data.total_cpu.usage_percent}%` }"
          ></div>
        </div>
        <div class="item-details">
          {{ data.total_cpu.cores_used.toFixed(1) }}/{{ data.total_cpu.cores_available }} cores
          ({{ data.total_cpu.agent_count }} agents)
        </div>
      </div>
      
      <!-- Total Memory -->
      <div class="overview-item">
        <div class="item-header">
          <span class="item-label">Total Memory</span>
          <span class="item-value">{{ data.total_memory.usage_percent.toFixed(1) }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill bg-purple-500"
            :style="{ width: `${data.total_memory.usage_percent}%` }"
          ></div>
        </div>
        <div class="item-details">
          {{ data.total_memory.used_gb.toFixed(1) }}/{{ data.total_memory.total_gb }} GB
          ({{ data.total_memory.agents_using_memory }} agents)
        </div>
      </div>
      
      <!-- API Usage -->
      <div class="overview-item">
        <div class="item-header">
          <span class="item-label">API Usage</span>
          <span class="item-value">${{ data.api_usage.total_cost.toFixed(2) }}</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill bg-green-500"
            :style="{ width: `${(data.api_usage.total_requests / data.api_usage.total_limit) * 100}%` }"
          ></div>
        </div>
        <div class="item-details">
          {{ data.api_usage.total_requests }}/{{ data.api_usage.total_limit }} requests
          (Peak: {{ data.api_usage.highest_usage_agent }})
        </div>
      </div>
      
      <!-- Queue Status -->
      <div class="overview-item">
        <div class="item-header">
          <span class="item-label">Queue Status</span>
          <span class="item-value">{{ data.queue_status.total_pending }}</span>
        </div>
        <div class="queue-metrics">
          <div class="queue-metric">
            <span class="metric-label">Active:</span>
            <span class="metric-value">{{ data.queue_status.total_active }}</span>
          </div>
          <div class="queue-metric">
            <span class="metric-label">Throughput:</span>
            <span class="metric-value">{{ data.queue_status.system_throughput }}/min</span>
          </div>
        </div>
        <div class="item-details" v-if="data.queue_status.bottleneck_agent">
          Bottleneck: {{ data.queue_status.bottleneck_agent }}
        </div>
      </div>
    </div>
    
    <!-- Agent Status Summary -->
    <div class="agent-summary">
      <h3 class="summary-title">Agent Status</h3>
      <div class="status-grid">
        <div class="status-item bg-green-100 text-green-800">
          <span class="status-count">{{ data.agents.active_count }}</span>
          <span class="status-label">Active</span>
        </div>
        <div class="status-item bg-blue-100 text-blue-800">
          <span class="status-count">{{ data.agents.idle_count }}</span>
          <span class="status-label">Idle</span>
        </div>
        <div class="status-item bg-red-100 text-red-800">
          <span class="status-count">{{ data.agents.error_count }}</span>
          <span class="status-label">Error</span>
        </div>
        <div class="status-item bg-gray-100 text-gray-800">
          <span class="status-count">{{ data.agents.offline_count }}</span>
          <span class="status-label">Offline</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SystemOverviewMetrics } from '@/types/resource-monitoring'

interface Props {
  data: SystemOverviewMetrics
}

defineProps<Props>()
</script>

<style scoped>
.system-overview-panel {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm;
}

.panel-title {
  @apply text-xl font-bold text-gray-900 dark:text-white mb-6;
}

.overview-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6;
}

.overview-item {
  @apply space-y-3;
}

.item-header {
  @apply flex justify-between items-center;
}

.item-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.item-value {
  @apply text-lg font-bold text-gray-900 dark:text-white;
}

.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700;
}

.progress-fill {
  @apply h-2 rounded-full transition-all duration-300;
}

.item-details {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.queue-metrics {
  @apply space-y-1;
}

.queue-metric {
  @apply flex justify-between text-sm;
}

.metric-label {
  @apply text-gray-600 dark:text-gray-400;
}

.metric-value {
  @apply text-gray-900 dark:text-white font-medium;
}

.agent-summary {
  @apply mt-6 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.summary-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.status-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.status-item {
  @apply rounded-lg p-4 text-center;
}

.status-count {
  @apply block text-2xl font-bold;
}

.status-label {
  @apply text-sm font-medium;
}
</style>
```

## 📊 Phase 3: Advanced Features (Week 5-6)

### **Step 3.1: Threshold Management System**

**Create Threshold Calculator** (`apps/client/src/utils/threshold-calculator.ts`):
```typescript
import type { ThresholdConfig, AlertLevel, ThresholdAlert } from '@/types/resource-monitoring'

export class ThresholdCalculator {
  private hysteresis: Map<string, boolean> = new Map()
  private alertCallbacks: ((alert: ThresholdAlert) => void)[] = []
  
  addAlertCallback(callback: (alert: ThresholdAlert) => void) {
    this.alertCallbacks.push(callback)
  }
  
  calculateAlertLevel(
    metricType: string,
    currentValue: number,
    thresholds: ThresholdConfig,
    agentId: string
  ): AlertLevel {
    const key = `${agentId}:${metricType}`
    const currentlyAlerting = this.hysteresis.get(key) || false
    
    let newLevel: AlertLevel = 'normal'
    
    if (currentlyAlerting) {
      // Use clear thresholds when currently alerting
      if (currentValue < thresholds.hysteresis.warning_clear) {
        this.hysteresis.set(key, false)
        newLevel = 'normal'
      } else if (currentValue < thresholds.hysteresis.critical_clear) {
        newLevel = 'warning'
      } else if (currentValue >= thresholds.thresholds.emergency.value) {
        newLevel = 'emergency'
      } else {
        newLevel = 'critical'
      }
    } else {
      // Use normal thresholds when not alerting
      if (currentValue >= thresholds.thresholds.emergency.value) {
        this.hysteresis.set(key, true)
        newLevel = 'emergency'
      } else if (currentValue >= thresholds.thresholds.critical.value) {
        this.hysteresis.set(key, true)
        newLevel = 'critical'
      } else if (currentValue >= thresholds.thresholds.warning.value) {
        this.hysteresis.set(key, true)
        newLevel = 'warning'
      }
    }
    
    // Trigger alert if level changed
    if (newLevel !== 'normal' && (!currentlyAlerting || newLevel === 'emergency')) {
      this.triggerAlert(agentId, metricType, newLevel, currentValue, thresholds)
    }
    
    return newLevel
  }
  
  private triggerAlert(
    agentId: string,
    metricType: string,
    severity: AlertLevel,
    currentValue: number,
    thresholds: ThresholdConfig
  ) {
    const alert: ThresholdAlert = {
      alert_id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_id: agentId,
      metric_type: metricType,
      severity,
      current_value: currentValue,
      threshold_value: thresholds.thresholds[severity].value,
      timestamp: new Date().toISOString(),
      message: this.generateAlertMessage(metricType, severity, currentValue),
      suggested_actions: this.generateSuggestedActions(metricType, severity)
    }
    
    this.alertCallbacks.forEach(callback => callback(alert))
  }
  
  private generateAlertMessage(metricType: string, severity: AlertLevel, value: number): string {
    const metricNames = {
      cpu: 'CPU usage',
      memory: 'Memory usage',
      api_rate: 'API rate limit',
      queue_depth: 'Queue depth'
    }
    
    const severityTexts = {
      warning: 'is elevated',
      critical: 'exceeded critical threshold',
      emergency: 'reached emergency levels'
    }
    
    return `${metricNames[metricType] || metricType} ${severityTexts[severity]} at ${value.toFixed(1)}%`
  }
  
  private generateSuggestedActions(metricType: string, severity: AlertLevel): string[] {
    const actions: Record<string, Record<AlertLevel, string[]>> = {
      cpu: {
        warning: ['Monitor CPU usage trends', 'Review recent workload changes'],
        critical: ['Scale up CPU resources', 'Reduce concurrent operations', 'Check for CPU-intensive processes'],
        emergency: ['Immediately scale up resources', 'Kill non-essential processes', 'Implement emergency throttling']
      },
      memory: {
        warning: ['Monitor memory allocation patterns', 'Review memory usage trends'],
        critical: ['Scale up memory allocation', 'Force garbage collection', 'Check for memory leaks'],
        emergency: ['Immediately increase memory limits', 'Restart agent if safe', 'Emergency heap dump analysis']
      },
      api_rate: {
        warning: ['Monitor API usage patterns', 'Review request distribution'],
        critical: ['Implement request throttling', 'Optimize API call efficiency', 'Consider rate limit increase'],
        emergency: ['Emergency API throttling', 'Pause non-critical operations', 'Contact API provider for limit increase']
      },
      queue_depth: {
        warning: ['Monitor queue processing trends', 'Review queue efficiency'],
        critical: ['Increase queue processing capacity', 'Optimize operation performance', 'Scale queue workers'],
        emergency: ['Emergency queue processing', 'Pause new queue additions', 'Implement queue overflow handling']
      }
    }
    
    return actions[metricType]?.[severity] || ['Review system performance', 'Contact system administrator']
  }
}
```

### **Step 3.2: Performance Optimization**

**Create Performance Monitor** (`apps/client/src/composables/usePerformanceMonitor.ts`):
```typescript
import { ref, onMounted, onUnmounted } from 'vue'

export function usePerformanceMonitor() {
  const frameRate = ref(0)
  const memoryUsage = ref(0)
  const updateLatency = ref(0)
  const isPerformanceSupported = ref(false)
  
  let frameCount = 0
  let lastFrameTime = performance.now()
  let animationFrameId: number | null = null
  let performanceObserver: PerformanceObserver | null = null
  
  const measureFrameRate = () => {
    const currentTime = performance.now()
    frameCount++
    
    if (currentTime - lastFrameTime >= 1000) {
      frameRate.value = Math.round((frameCount * 1000) / (currentTime - lastFrameTime))
      frameCount = 0
      lastFrameTime = currentTime
    }
    
    animationFrameId = requestAnimationFrame(measureFrameRate)
  }
  
  const measureMemoryUsage = () => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      memoryUsage.value = Math.round(memInfo.usedJSHeapSize / (1024 * 1024)) // Convert to MB
    }
  }
  
  const measureUpdateLatency = () => {
    if ('PerformanceObserver' in window) {
      performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const latencies = entries
          .filter(entry => entry.name.includes('resource-update'))
          .map(entry => entry.duration)
        
        if (latencies.length > 0) {
          updateLatency.value = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        }
      })
      
      performanceObserver.observe({ entryTypes: ['measure'] })
    }
  }
  
  const markUpdateStart = (identifier: string) => {
    performance.mark(`resource-update-start-${identifier}`)
  }
  
  const markUpdateEnd = (identifier: string) => {
    performance.mark(`resource-update-end-${identifier}`)
    performance.measure(
      `resource-update-${identifier}`,
      `resource-update-start-${identifier}`,
      `resource-update-end-${identifier}`
    )
  }
  
  const getPerformanceReport = () => {
    return {
      frameRate: frameRate.value,
      memoryUsage: memoryUsage.value,
      updateLatency: updateLatency.value,
      isHealthy: frameRate.value >= 30 && memoryUsage.value < 100 && updateLatency.value < 100
    }
  }
  
  onMounted(() => {
    isPerformanceSupported.value = 'performance' in window && 'now' in performance
    
    if (isPerformanceSupported.value) {
      measureFrameRate()
      measureUpdateLatency()
      
      // Measure memory usage every 5 seconds
      setInterval(measureMemoryUsage, 5000)
      measureMemoryUsage()
    }
  })
  
  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    
    if (performanceObserver) {
      performanceObserver.disconnect()
    }
  })
  
  return {
    frameRate,
    memoryUsage,
    updateLatency,
    isPerformanceSupported,
    markUpdateStart,
    markUpdateEnd,
    getPerformanceReport
  }
}
```

## 🧪 Phase 4: Testing & Optimization (Week 7-8)

### **Step 4.1: Comprehensive Testing Strategy**

**Component Integration Tests** (`apps/client/src/components/__tests__/AgentResourceCard.test.ts`):
```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AgentResourceCard from '../AgentResourceCard.vue'
import type { AgentResourceMetrics, ThresholdConfig } from '@/types/resource-monitoring'

const mockAgentData: AgentResourceMetrics = {
  agent_id: 'test-agent',
  timestamp: '2025-07-16T18:22:56.000Z',
  cpu: {
    usage_percent: 75.5,
    cores_used: 2.265,
    cores_total: 3.0,
    load_average: [1.2, 1.4, 1.6],
    trend_data: [70, 72, 75, 73, 75.5],
    throttling_count: 0
  },
  memory: {
    used_mb: 512,
    total_mb: 1024,
    usage_percent: 50.0,
    available_mb: 512,
    trend_data: [48, 49, 51, 50, 50],
    gc_events: 2,
    heap_size_mb: 384
  },
  api: {
    requests_used: 45,
    requests_limit: 100,
    rate_per_minute: 85,
    tokens_consumed: 450,
    estimated_cost: 0.009,
    throttle_events: 0,
    error_rate_percent: 2.1,
    avg_response_time_ms: 245
  },
  queue: {
    pending_operations: 3,
    concurrent_limit: 10,
    active_operations: 7,
    avg_wait_time_ms: 1200,
    throughput_per_minute: 45,
    failed_operations: 1,
    queue_overflow_count: 0
  },
  status: {
    state: 'active',
    last_activity: '2025-07-16T18:22:55.000Z',
    uptime_seconds: 3661,
    version: '1.2.3'
  }
}

const mockThresholds: ThresholdConfig[] = [
  {
    metric_type: 'cpu',
    thresholds: {
      warning: { value: 75, color: '#FBB040', notify: true },
      critical: { value: 90, color: '#E53E3E', notify: true },
      emergency: { value: 95, color: '#C53030', notify: true }
    },
    hysteresis: {
      warning_clear: 70,
      critical_clear: 85
    }
  }
]

describe('AgentResourceCard', () => {
  it('renders agent information correctly', () => {
    const wrapper = mount(AgentResourceCard, {
      props: {
        data: mockAgentData,
        thresholds: mockThresholds
      }
    })
    
    expect(wrapper.text()).toContain('test-agent')
    expect(wrapper.text()).toContain('active')
    expect(wrapper.text()).toContain('75.5%')
  })
  
  it('applies correct threshold styling', () => {
    const wrapper = mount(AgentResourceCard, {
      props: {
        data: mockAgentData,
        thresholds: mockThresholds
      }
    })
    
    const progressBars = wrapper.findAll('.progress-fill')
    expect(progressBars[0].classes()).toContain('bg-yellow-500') // Warning level
  })
  
  it('emits alert when threshold is exceeded', async () => {
    const highCpuData = {
      ...mockAgentData,
      cpu: { ...mockAgentData.cpu, usage_percent: 92 }
    }
    
    const wrapper = mount(AgentResourceCard, {
      props: {
        data: highCpuData,
        thresholds: mockThresholds
      }
    })
    
    // Verify critical styling
    const progressBars = wrapper.findAll('.progress-fill')
    expect(progressBars[0].classes()).toContain('bg-red-500')
  })
  
  it('formats data correctly', () => {
    const wrapper = mount(AgentResourceCard, {
      props: {
        data: mockAgentData,
        thresholds: mockThresholds
      }
    })
    
    expect(wrapper.text()).toContain('2.27/3.0 cores') // CPU details
    expect(wrapper.text()).toContain('512.0 MB/1.0 GB') // Memory details
    expect(wrapper.text()).toContain('45/100 req') // API details
  })
})
```

### **Step 4.2: Performance Testing**

**Load Testing Script** (`apps/client/src/tests/performance/load-test.ts`):
```typescript
import { createApp } from 'vue'
import ResourceMonitorDashboard from '@/components/ResourceMonitorDashboard.vue'
import type { AgentResourceMetrics } from '@/types/resource-monitoring'

class LoadTester {
  private agents: AgentResourceMetrics[] = []
  private updateInterval: number | null = null
  private performanceMetrics: {
    renderTimes: number[]
    memoryUsage: number[]
    frameDrops: number
  } = {
    renderTimes: [],
    memoryUsage: [],
    frameDrops: 0
  }
  
  generateMockAgent(id: string): AgentResourceMetrics {
    return {
      agent_id: id,
      timestamp: new Date().toISOString(),
      cpu: {
        usage_percent: Math.random() * 100,
        cores_used: Math.random() * 4,
        cores_total: 4,
        load_average: [Math.random(), Math.random(), Math.random()],
        trend_data: Array.from({ length: 60 }, () => Math.random() * 100),
        throttling_count: Math.floor(Math.random() * 5)
      },
      memory: {
        used_mb: Math.random() * 2048,
        total_mb: 2048,
        usage_percent: Math.random() * 100,
        available_mb: Math.random() * 1024,
        trend_data: Array.from({ length: 60 }, () => Math.random() * 100),
        gc_events: Math.floor(Math.random() * 10),
        heap_size_mb: Math.random() * 1024
      },
      api: {
        requests_used: Math.floor(Math.random() * 100),
        requests_limit: 100,
        rate_per_minute: Math.random() * 100,
        tokens_consumed: Math.floor(Math.random() * 1000),
        estimated_cost: Math.random() * 0.1,
        throttle_events: Math.floor(Math.random() * 5),
        error_rate_percent: Math.random() * 10,
        avg_response_time_ms: Math.random() * 500
      },
      queue: {
        pending_operations: Math.floor(Math.random() * 20),
        concurrent_limit: 10,
        active_operations: Math.floor(Math.random() * 10),
        avg_wait_time_ms: Math.random() * 2000,
        throughput_per_minute: Math.floor(Math.random() * 100),
        failed_operations: Math.floor(Math.random() * 5),
        queue_overflow_count: Math.floor(Math.random() * 3)
      },
      status: {
        state: ['active', 'idle', 'busy', 'error', 'offline'][Math.floor(Math.random() * 5)] as any,
        last_activity: new Date().toISOString(),
        uptime_seconds: Math.floor(Math.random() * 86400),
        version: '1.2.3'
      }
    }
  }
  
  async testWithAgentCount(agentCount: number, duration: number = 30000): Promise<void> {
    console.log(`Starting load test with ${agentCount} agents for ${duration}ms`)
    
    // Generate mock agents
    this.agents = Array.from({ length: agentCount }, (_, i) => 
      this.generateMockAgent(`agent_${i.toString().padStart(3, '0')}`)
    )
    
    // Start performance monitoring
    this.startPerformanceMonitoring()
    
    // Simulate real-time updates
    this.updateInterval = setInterval(() => {
      const startTime = performance.now()
      
      // Update random agents
      const updateCount = Math.floor(agentCount * 0.1) // Update 10% of agents
      for (let i = 0; i < updateCount; i++) {
        const randomIndex = Math.floor(Math.random() * this.agents.length)
        this.agents[randomIndex] = this.generateMockAgent(this.agents[randomIndex].agent_id)
      }
      
      const renderTime = performance.now() - startTime
      this.performanceMetrics.renderTimes.push(renderTime)
      
      if (renderTime > 16.67) { // > 60 FPS
        this.performanceMetrics.frameDrops++
      }
    }, 1000) // Update every second
    
    // Stop test after duration
    setTimeout(() => {
      this.stopTest()
      this.generateReport()
    }, duration)
  }
  
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory
        this.performanceMetrics.memoryUsage.push(memInfo.usedJSHeapSize / (1024 * 1024))
      }
    }, 1000)
  }
  
  private stopTest(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }
  
  private generateReport(): void {
    const avgRenderTime = this.performanceMetrics.renderTimes.reduce((a, b) => a + b, 0) / 
                          this.performanceMetrics.renderTimes.length
    const maxRenderTime = Math.max(...this.performanceMetrics.renderTimes)
    const avgMemoryUsage = this.performanceMetrics.memoryUsage.reduce((a, b) => a + b, 0) / 
                           this.performanceMetrics.memoryUsage.length
    const maxMemoryUsage = Math.max(...this.performanceMetrics.memoryUsage)
    
    console.log('Load Test Report:')
    console.log(`Agents: ${this.agents.length}`)
    console.log(`Average Render Time: ${avgRenderTime.toFixed(2)}ms`)
    console.log(`Max Render Time: ${maxRenderTime.toFixed(2)}ms`)
    console.log(`Frame Drops: ${this.performanceMetrics.frameDrops}`)
    console.log(`Average Memory Usage: ${avgMemoryUsage.toFixed(2)}MB`)
    console.log(`Max Memory Usage: ${maxMemoryUsage.toFixed(2)}MB`)
    console.log(`Performance Grade: ${this.calculateGrade(avgRenderTime, maxMemoryUsage)}`)
  }
  
  private calculateGrade(avgRenderTime: number, maxMemoryUsage: number): string {
    if (avgRenderTime < 10 && maxMemoryUsage < 50) return 'A+'
    if (avgRenderTime < 16.67 && maxMemoryUsage < 75) return 'A'
    if (avgRenderTime < 33 && maxMemoryUsage < 100) return 'B'
    if (avgRenderTime < 50 && maxMemoryUsage < 150) return 'C'
    return 'F'
  }
}

// Run load tests
const loadTester = new LoadTester()

// Test scenarios
async function runLoadTests() {
  await loadTester.testWithAgentCount(10, 10000)   // 10 agents for 10 seconds
  await loadTester.testWithAgentCount(50, 15000)   // 50 agents for 15 seconds
  await loadTester.testWithAgentCount(100, 20000)  // 100 agents for 20 seconds
  await loadTester.testWithAgentCount(500, 30000)  // 500 agents for 30 seconds
}

export { LoadTester, runLoadTests }
```

### **Step 4.3: Final Integration & Documentation**

**Update Main App** (`apps/client/src/App.vue`):
```vue
<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <ResourceMonitorDashboard />
  </div>
</template>

<script setup lang="ts">
import ResourceMonitorDashboard from '@/components/ResourceMonitorDashboard.vue'
</script>
```

**Update Router** (if using Vue Router):
```typescript
import { createRouter, createWebHistory } from 'vue-router'
import ResourceMonitorDashboard from '@/components/ResourceMonitorDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: ResourceMonitorDashboard
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "market_intelligence", "content": "Gather market intelligence on resource monitoring dashboard patterns from leading competitors", "status": "completed", "priority": "high"}, {"id": "technical_research", "content": "Research technical specifications for real-time monitoring dashboards with Chart.js and WebSocket", "status": "completed", "priority": "high"}, {"id": "ux_requirements", "content": "Research UX patterns and requirements for multi-agent resource monitoring interfaces", "status": "completed", "priority": "high"}, {"id": "create_specification", "content": "Create comprehensive feature specification document with all technical details", "status": "completed", "priority": "medium"}, {"id": "create_technical_requirements", "content": "Generate detailed technical requirements document", "status": "completed", "priority": "medium"}, {"id": "create_user_stories", "content": "Create user stories and acceptance criteria document", "status": "completed", "priority": "medium"}, {"id": "create_api_spec", "content": "Generate API specification for resource monitoring endpoints", "status": "completed", "priority": "medium"}, {"id": "create_implementation_guide", "content": "Create step-by-step implementation guide", "status": "completed", "priority": "low"}]