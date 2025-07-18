# 🔧 Agent Performance Dashboard Cards - Technical Implementation Guide

**Project**: Multi-Agent Observability System  
**Feature**: Agent Performance Dashboard Cards  
**Created**: 2025-07-16 18:09:05  
**Version**: 1.0  
**Target**: Vue.js 3.5 + TypeScript + Tailwind CSS  

## 📋 Technical Architecture Overview

This implementation guide provides detailed technical specifications for building Agent Performance Dashboard Cards as Vue.js components within the existing multi-agent observability system.

### Technology Stack Integration
- **Frontend**: Vue.js 3.5 with Composition API
- **Styling**: Tailwind CSS v4 with existing theme system
- **TypeScript**: Full type safety with interface definitions
- **State Management**: Reactive Vue state with WebSocket integration
- **Real-time**: WebSocket connection to existing server infrastructure

## 🏗️ Component Architecture

### 1. Core Component Structure

#### Primary Component: `AgentPerformanceCard.vue`
```vue
<template>
  <div 
    class="agent-performance-card"
    :class="cardStateClasses"
    @click="handleCardClick"
  >
    <AgentHeader 
      :agent-id="agentId"
      :is-online="isOnline"
      :status="connectionStatus"
    />
    
    <MetricsSection 
      :metrics="metrics"
      :trends="trends"
      :compact="compactMode"
    />
    
    <TaskProgress 
      v-if="currentTask"
      :task="currentTask"
      :show-details="!compactMode"
    />
    
    <ErrorStatus 
      :errors="errors"
      :show-history="showErrorHistory"
      @toggle-history="showErrorHistory = !showErrorHistory"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAgentMetrics } from '@/composables/useAgentMetrics';
import { useCardAnimations } from '@/composables/useCardAnimations';
import type { AgentPerformanceData } from '@/types/agent';

// Component imports
import AgentHeader from './components/AgentHeader.vue';
import MetricsSection from './components/MetricsSection.vue';
import TaskProgress from './components/TaskProgress.vue';
import ErrorStatus from './components/ErrorStatus.vue';

interface Props {
  agentId: string;
  initialData?: AgentPerformanceData;
  compactMode?: boolean;
  updateInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  compactMode: false,
  updateInterval: 1000
});

// Composables
const { 
  metrics, 
  trends, 
  currentTask, 
  errors, 
  isOnline, 
  connectionStatus 
} = useAgentMetrics(props.agentId, props.updateInterval);

const { cardStateClasses, animateUpdate } = useCardAnimations();

// Local state
const showErrorHistory = ref(false);

// Computed properties
const cardStateClasses = computed(() => ({
  'agent-card-compact': props.compactMode,
  'agent-card-offline': !isOnline.value,
  'agent-card-error': errors.value.count > 0,
  'agent-card-updating': connectionStatus.value === 'updating'
}));

// Event handlers
const handleCardClick = () => {
  // Emit event for parent to handle (e.g., open detailed view)
  emit('card-click', props.agentId);
};

// Watchers
watch(metrics, () => {
  animateUpdate();
}, { deep: true });
</script>
```

### 2. Sub-Components

#### AgentHeader.vue
```vue
<template>
  <div class="agent-header">
    <div class="agent-info">
      <h3 class="agent-id">{{ agentId }}</h3>
      <div class="agent-status" :class="statusClasses">
        <span class="status-indicator"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>
    <div class="agent-actions">
      <button 
        v-if="!isOnline" 
        @click="$emit('reconnect')"
        class="btn-reconnect"
        title="Reconnect Agent"
      >
        🔄
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  agentId: string;
  isOnline: boolean;
  status: 'connected' | 'disconnected' | 'updating' | 'error';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  reconnect: [];
}>();

const statusClasses = computed(() => ({
  'status-online': props.isOnline && props.status === 'connected',
  'status-offline': !props.isOnline,
  'status-updating': props.status === 'updating',
  'status-error': props.status === 'error'
}));

const statusText = computed(() => {
  switch (props.status) {
    case 'connected': return 'Online';
    case 'disconnected': return 'Offline';
    case 'updating': return 'Updating';
    case 'error': return 'Error';
    default: return 'Unknown';
  }
});
</script>

<style scoped>
.agent-header {
  @apply px-4 py-3 border-b border-gray-100 dark:border-gray-700 
         flex items-center justify-between;
}

.agent-id {
  @apply font-semibold text-sm text-gray-900 dark:text-white;
}

.agent-status {
  @apply flex items-center space-x-1.5 text-xs;
}

.status-indicator {
  @apply w-2 h-2 rounded-full;
}

.status-online .status-indicator {
  @apply bg-green-500 animate-pulse;
}

.status-offline .status-indicator {
  @apply bg-red-500;
}

.status-updating .status-indicator {
  @apply bg-yellow-500 animate-spin;
}

.status-error .status-indicator {
  @apply bg-red-600 animate-bounce;
}

.btn-reconnect {
  @apply p-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 
         rounded transition-colors;
}
</style>
```

#### MetricsSection.vue
```vue
<template>
  <div class="metrics-section" :class="{ 'compact': compact }">
    <div class="metrics-row">
      <MetricDisplay
        icon="🚀"
        :value="formatSpeed(metrics.toolExecutionSpeed)"
        label="Speed"
        :trend="trends.speedChange"
        :color="speedColor"
      />
      <MetricDisplay
        icon="✅"
        :value="`${metrics.successRate}%`"
        label="Success"
        :trend="trends.successRateChange"
        :color="successColor"
      />
    </div>
    
    <div class="metrics-row">
      <MetricDisplay
        icon="⚡"
        :value="`${formatNumber(metrics.tokensPerMinute)} tok/min`"
        label="Efficiency"
        :trend="trends.efficiencyChange"
        color="blue"
      />
      <MetricDisplay
        icon="💰"
        :value="`$${metrics.costPerHour.toFixed(2)}/hr`"
        label="Cost"
        :trend="trends.costChange"
        color="purple"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AgentMetrics, MetricTrends } from '@/types/agent';
import MetricDisplay from './MetricDisplay.vue';

interface Props {
  metrics: AgentMetrics;
  trends: MetricTrends;
  compact?: boolean;
}

const props = defineProps<Props>();

// Computed colors based on performance thresholds
const speedColor = computed(() => {
  const speed = props.metrics.toolExecutionSpeed;
  if (speed < 500) return 'green';
  if (speed < 1500) return 'yellow';
  return 'red';
});

const successColor = computed(() => {
  const rate = props.metrics.successRate;
  if (rate >= 95) return 'green';
  if (rate >= 85) return 'yellow';
  return 'red';
});

// Utility functions
const formatSpeed = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};
</script>

<style scoped>
.metrics-section {
  @apply px-4 py-3 space-y-2;
}

.metrics-section.compact {
  @apply py-2 space-y-1;
}

.metrics-row {
  @apply flex justify-between items-center;
}
</style>
```

#### MetricDisplay.vue
```vue
<template>
  <div class="metric-display" :class="`metric-${color}`">
    <div class="metric-header">
      <span class="metric-icon">{{ icon }}</span>
      <span class="metric-value">{{ value }}</span>
      <TrendArrow 
        v-if="trend !== undefined" 
        :change="trend" 
        :size="'sm'"
      />
    </div>
    <span class="metric-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import TrendArrow from './TrendArrow.vue';

interface Props {
  icon: string;
  value: string;
  label: string;
  trend?: number;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}

defineProps<Props>();
</script>

<style scoped>
.metric-display {
  @apply flex flex-col space-y-1;
}

.metric-header {
  @apply flex items-center space-x-1;
}

.metric-icon {
  @apply text-lg;
}

.metric-value {
  @apply font-bold text-sm;
}

.metric-label {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.metric-green .metric-value {
  @apply text-green-600 dark:text-green-400;
}

.metric-yellow .metric-value {
  @apply text-yellow-600 dark:text-yellow-400;
}

.metric-red .metric-value {
  @apply text-red-600 dark:text-red-400;
}

.metric-blue .metric-value {
  @apply text-blue-600 dark:text-blue-400;
}

.metric-purple .metric-value {
  @apply text-purple-600 dark:text-purple-400;
}
</style>
```

## 🔧 Composables Implementation

### useAgentMetrics.ts
```typescript
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWebSocket } from './useWebSocket';
import type { 
  AgentMetrics, 
  MetricTrends, 
  TaskProgress, 
  ErrorStatus,
  AgentPerformanceData 
} from '@/types/agent';

export function useAgentMetrics(agentId: string, updateInterval: number = 1000) {
  // Reactive state
  const metrics = ref<AgentMetrics>({
    toolExecutionSpeed: 0,
    tokenEfficiency: 0,
    successRate: 0,
    tokensPerMinute: 0,
    costPerHour: 0
  });
  
  const trends = ref<MetricTrends>({
    speedChange: 0,
    successRateChange: 0,
    efficiencyChange: 0,
    costChange: 0
  });
  
  const currentTask = ref<TaskProgress | null>(null);
  const errors = ref<ErrorStatus>({
    count: 0,
    lastError: null
  });
  
  const isOnline = ref(false);
  const connectionStatus = ref<'connected' | 'disconnected' | 'updating' | 'error'>('disconnected');
  const lastUpdated = ref<Date>(new Date());
  
  // WebSocket connection
  const { 
    connect, 
    disconnect, 
    sendMessage, 
    isConnected,
    lastMessage 
  } = useWebSocket();
  
  // Computed properties
  const isHealthy = computed(() => {
    return isOnline.value && 
           errors.value.count === 0 && 
           metrics.value.successRate > 85;
  });
  
  const performanceScore = computed(() => {
    const speedScore = Math.max(0, 100 - (metrics.value.toolExecutionSpeed / 10));
    const successScore = metrics.value.successRate;
    const efficiencyScore = Math.min(100, metrics.value.tokenEfficiency);
    
    return Math.round((speedScore + successScore + efficiencyScore) / 3);
  });
  
  // Methods
  const updateMetrics = (data: AgentPerformanceData) => {
    // Calculate trends before updating
    const previousMetrics = { ...metrics.value };
    
    // Update metrics
    metrics.value = data.metrics;
    currentTask.value = data.currentTask;
    errors.value = data.errors;
    isOnline.value = data.isOnline;
    lastUpdated.value = new Date();
    
    // Calculate trends
    trends.value = {
      speedChange: calculatePercentageChange(
        previousMetrics.toolExecutionSpeed, 
        data.metrics.toolExecutionSpeed
      ),
      successRateChange: calculatePercentageChange(
        previousMetrics.successRate, 
        data.metrics.successRate
      ),
      efficiencyChange: calculatePercentageChange(
        previousMetrics.tokenEfficiency, 
        data.metrics.tokenEfficiency
      ),
      costChange: calculatePercentageChange(
        previousMetrics.costPerHour, 
        data.metrics.costPerHour
      )
    };
    
    connectionStatus.value = 'connected';
  };
  
  const calculatePercentageChange = (previous: number, current: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'agent_metrics_update' && message.data.agentId === agentId) {
      updateMetrics(message.data);
    }
  };
  
  const handleConnectionError = () => {
    connectionStatus.value = 'error';
    isOnline.value = false;
  };
  
  const reconnect = async () => {
    connectionStatus.value = 'updating';
    try {
      await connect(`ws://localhost:4000/agents/${agentId}/metrics`);
      connectionStatus.value = 'connected';
    } catch (error) {
      console.error('Failed to reconnect:', error);
      handleConnectionError();
    }
  };
  
  // Lifecycle
  onMounted(async () => {
    try {
      // Subscribe to agent-specific metrics
      await connect(`ws://localhost:4000/agents/${agentId}/metrics`);
      
      // Set up message handler
      watch(lastMessage, handleWebSocketMessage);
      
      // Initial data fetch
      const response = await fetch(`/api/agents/${agentId}/metrics`);
      if (response.ok) {
        const data = await response.json();
        updateMetrics(data);
      }
    } catch (error) {
      console.error('Failed to initialize agent metrics:', error);
      handleConnectionError();
    }
  });
  
  onUnmounted(() => {
    disconnect();
  });
  
  return {
    // State
    metrics: readonly(metrics),
    trends: readonly(trends),
    currentTask: readonly(currentTask),
    errors: readonly(errors),
    isOnline: readonly(isOnline),
    connectionStatus: readonly(connectionStatus),
    lastUpdated: readonly(lastUpdated),
    
    // Computed
    isHealthy,
    performanceScore,
    
    // Methods
    reconnect,
    updateMetrics
  };
}
```

### useCardAnimations.ts
```typescript
import { ref, nextTick } from 'vue';

export function useCardAnimations() {
  const isAnimating = ref(false);
  const animationType = ref<'update' | 'error' | 'success' | null>(null);
  
  const cardStateClasses = computed(() => ({
    'card-animating': isAnimating.value,
    'card-update-animation': animationType.value === 'update',
    'card-error-animation': animationType.value === 'error',
    'card-success-animation': animationType.value === 'success'
  }));
  
  const animateUpdate = async (type: 'update' | 'error' | 'success' = 'update') => {
    animationType.value = type;
    isAnimating.value = true;
    
    await nextTick();
    
    setTimeout(() => {
      isAnimating.value = false;
      animationType.value = null;
    }, 300);
  };
  
  const animateMetricChange = (element: HTMLElement, newValue: string) => {
    element.style.transform = 'scale(1.1)';
    element.style.transition = 'transform 0.2s ease-out';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 200);
  };
  
  return {
    cardStateClasses,
    animateUpdate,
    animateMetricChange,
    isAnimating: readonly(isAnimating)
  };
}
```

## 📡 WebSocket Integration

### Message Protocol
```typescript
// Incoming message types
interface AgentMetricsUpdateMessage {
  type: 'agent_metrics_update';
  data: {
    agentId: string;
    timestamp: number;
    metrics: AgentMetrics;
    currentTask?: TaskProgress;
    errors: ErrorStatus;
    isOnline: boolean;
  };
}

interface AgentStatusChangeMessage {
  type: 'agent_status_change';
  data: {
    agentId: string;
    status: 'online' | 'offline' | 'error';
    timestamp: number;
  };
}

// Outgoing message types
interface SubscribeToAgentMessage {
  type: 'subscribe_agent_metrics';
  data: {
    agentId: string;
    updateInterval?: number;
  };
}
```

### Connection Management
```typescript
// Enhanced WebSocket composable for agent metrics
export function useAgentWebSocket(agentId: string) {
  const ws = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const maxReconnectAttempts = 5;
  
  const connect = () => {
    return new Promise<void>((resolve, reject) => {
      try {
        ws.value = new WebSocket(`ws://localhost:4000/agents/${agentId}/stream`);
        
        ws.value.onopen = () => {
          isConnected.value = true;
          reconnectAttempts.value = 0;
          
          // Subscribe to agent metrics
          ws.value?.send(JSON.stringify({
            type: 'subscribe_agent_metrics',
            data: { agentId, updateInterval: 1000 }
          }));
          
          resolve();
        };
        
        ws.value.onmessage = (event) => {
          const message = JSON.parse(event.data);
          handleMessage(message);
        };
        
        ws.value.onclose = () => {
          isConnected.value = false;
          attemptReconnect();
        };
        
        ws.value.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  };
  
  const attemptReconnect = () => {
    if (reconnectAttempts.value < maxReconnectAttempts) {
      reconnectAttempts.value++;
      const delay = Math.pow(2, reconnectAttempts.value) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`Reconnection attempt ${reconnectAttempts.value}/${maxReconnectAttempts}`);
        connect().catch(console.error);
      }, delay);
    }
  };
  
  return {
    connect,
    disconnect: () => {
      ws.value?.close();
      ws.value = null;
      isConnected.value = false;
    },
    isConnected: readonly(isConnected),
    reconnectAttempts: readonly(reconnectAttempts)
  };
}
```

## 🎨 Styling Implementation

### Tailwind CSS Classes
```css
/* Agent Performance Card Styles */
.agent-performance-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md 
         border border-gray-200 dark:border-gray-700 
         transition-all duration-200 hover:shadow-lg 
         cursor-pointer overflow-hidden;
  
  /* Card dimensions */
  width: 320px;
  min-height: 180px;
}

.agent-performance-card:hover {
  @apply shadow-lg transform scale-105;
}

/* Compact mode */
.agent-card-compact {
  width: 280px;
  min-height: 160px;
}

/* Status states */
.agent-card-offline {
  @apply border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20;
}

.agent-card-error {
  @apply border-red-400 dark:border-red-500;
}

.agent-card-updating {
  @apply border-yellow-300 dark:border-yellow-600;
}

/* Animation states */
.card-animating {
  @apply transition-all duration-300;
}

.card-update-animation {
  @apply ring-2 ring-blue-300 ring-opacity-50;
  animation: pulse-blue 0.3s ease-out;
}

.card-error-animation {
  @apply ring-2 ring-red-300 ring-opacity-50;
  animation: shake 0.3s ease-out;
}

.card-success-animation {
  @apply ring-2 ring-green-300 ring-opacity-50;
  animation: pulse-green 0.3s ease-out;
}

/* Custom animations */
@keyframes pulse-blue {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

@keyframes pulse-green {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Progress bar styles */
.progress-bar {
  @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden;
}

.progress-fill {
  @apply h-full rounded-full transition-all duration-300 ease-out;
  background: linear-gradient(90deg, 
    var(--theme-primary), 
    var(--theme-primary-light)
  );
}

.progress-fill.animated {
  background-size: 200% 100%;
  animation: progress-shimmer 1.5s infinite linear;
}

@keyframes progress-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Responsive design */
@media (max-width: 768px) {
  .agent-performance-card {
    width: 100%;
    min-height: 140px;
  }
  
  .agent-card-compact {
    width: 100%;
    min-height: 120px;
  }
}

/* Theme integration */
.agent-performance-card {
  background: var(--theme-bg-primary);
  border-color: var(--theme-border);
  color: var(--theme-text-primary);
}

.dark .agent-performance-card {
  background: var(--theme-bg-secondary);
  border-color: var(--theme-border-dark);
}
```

## 🧪 Testing Implementation

### Unit Test Example
```typescript
// AgentPerformanceCard.test.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import AgentPerformanceCard from '@/components/AgentPerformanceCard.vue';
import type { AgentPerformanceData } from '@/types/agent';

const mockAgentData: AgentPerformanceData = {
  agentId: 'test-agent-001',
  isOnline: true,
  metrics: {
    toolExecutionSpeed: 450,
    tokenEfficiency: 85,
    successRate: 96,
    tokensPerMinute: 1250,
    costPerHour: 0.23
  },
  currentTask: {
    name: 'Analyzing data',
    progress: 65,
    type: 'analysis',
    estimatedCompletion: new Date(Date.now() + 30000)
  },
  errors: {
    count: 0,
    lastError: null
  }
};

describe('AgentPerformanceCard', () => {
  it('renders agent metrics correctly', () => {
    const wrapper = mount(AgentPerformanceCard, {
      props: {
        agentId: 'test-agent-001',
        initialData: mockAgentData
      }
    });
    
    expect(wrapper.find('.agent-id').text()).toBe('test-agent-001');
    expect(wrapper.find('[data-testid="success-rate"]').text()).toContain('96%');
    expect(wrapper.find('[data-testid="tool-speed"]').text()).toContain('450ms');
  });
  
  it('shows offline state correctly', async () => {
    const offlineData = { ...mockAgentData, isOnline: false };
    
    const wrapper = mount(AgentPerformanceCard, {
      props: {
        agentId: 'test-agent-001',
        initialData: offlineData
      }
    });
    
    expect(wrapper.classes()).toContain('agent-card-offline');
    expect(wrapper.find('.status-text').text()).toBe('Offline');
  });
  
  it('displays error state when errors present', async () => {
    const errorData = {
      ...mockAgentData,
      errors: {
        count: 3,
        lastError: {
          timestamp: new Date(),
          message: 'Connection timeout',
          severity: 'high' as const
        }
      }
    };
    
    const wrapper = mount(AgentPerformanceCard, {
      props: {
        agentId: 'test-agent-001',
        initialData: errorData
      }
    });
    
    expect(wrapper.find('[data-testid="error-count"]').text()).toBe('3');
    expect(wrapper.classes()).toContain('agent-card-error');
  });
  
  it('emits card-click event when clicked', async () => {
    const wrapper = mount(AgentPerformanceCard, {
      props: {
        agentId: 'test-agent-001',
        initialData: mockAgentData
      }
    });
    
    await wrapper.trigger('click');
    
    expect(wrapper.emitted('card-click')).toBeTruthy();
    expect(wrapper.emitted('card-click')?.[0]).toEqual(['test-agent-001']);
  });
});
```

### Integration Test Example
```typescript
// AgentPerformanceCard.integration.test.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import AgentPerformanceCard from '@/components/AgentPerformanceCard.vue';

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

global.WebSocket = vi.fn(() => mockWebSocket) as any;

describe('AgentPerformanceCard Integration', () => {
  it('connects to WebSocket on mount', async () => {
    const wrapper = mount(AgentPerformanceCard, {
      props: {
        agentId: 'test-agent-001'
      },
      global: {
        plugins: [createTestingPinia()]
      }
    });
    
    expect(global.WebSocket).toHaveBeenCalledWith(
      'ws://localhost:4000/agents/test-agent-001/metrics'
    );
  });
  
  it('updates metrics when WebSocket message received', async () => {
    const wrapper = mount(AgentPerformanceCard, {
      props: {
        agentId: 'test-agent-001'
      },
      global: {
        plugins: [createTestingPinia()]
      }
    });
    
    // Simulate WebSocket message
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'agent_metrics_update',
        data: {
          agentId: 'test-agent-001',
          timestamp: Date.now(),
          metrics: {
            toolExecutionSpeed: 300,
            successRate: 98,
            tokensPerMinute: 1500,
            costPerHour: 0.18
          },
          isOnline: true,
          errors: { count: 0 }
        }
      })
    });
    
    mockWebSocket.onmessage(messageEvent);
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('[data-testid="tool-speed"]').text()).toContain('300ms');
    expect(wrapper.find('[data-testid="success-rate"]').text()).toContain('98%');
  });
});
```

## 📚 Implementation Checklist

### Phase 1: Core Structure ✅
- [ ] Create base component files
- [ ] Implement TypeScript interfaces
- [ ] Set up basic layout and styling
- [ ] Add responsive design classes

### Phase 2: Real-time Integration ✅
- [ ] Implement WebSocket composable
- [ ] Add connection management
- [ ] Handle message parsing and updates
- [ ] Add error handling and fallbacks

### Phase 3: Advanced Features ✅
- [ ] Implement trend calculations
- [ ] Add progress bar animations
- [ ] Create performance optimizations
- [ ] Add accessibility features

### Phase 4: Testing & Polish ✅
- [ ] Write unit tests
- [ ] Create integration tests
- [ ] Add visual regression tests
- [ ] Performance testing
- [ ] Documentation completion

---

**This technical implementation guide provides a complete roadmap for building high-performance, real-time Agent Performance Dashboard Cards that integrate seamlessly with the existing Vue.js + TypeScript + Tailwind CSS architecture.**