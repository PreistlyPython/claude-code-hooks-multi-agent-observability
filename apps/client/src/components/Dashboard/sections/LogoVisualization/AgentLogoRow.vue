<template>
  <div 
    class="agent-logo-row"
    :class="{
      'is-selected': isSelected,
      'is-active': agent.status === 'active',
      'is-error': agent.status === 'error',
      'is-idle': agent.status === 'idle'
    }"
    @click="$emit('click')"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Agent Logo Container -->
    <div class="logo-container">
      <!-- Animated Status Ring -->
      <div class="status-ring" :class="`status-${agent.status}`">
        <div class="ring-pulse"></div>
      </div>
      
      <!-- Agent Logo -->
      <div class="agent-logo">
        <AnimatedLogo
          :agent-type="agent.type"
          :status="agent.status"
          :is-hovered="isHovered"
        />
      </div>
      
      <!-- Activity Pulse -->
      <div v-if="agent.status === 'active'" class="activity-pulse">
        <span class="pulse-dot"></span>
      </div>
    </div>

    <!-- Agent Info -->
    <div class="agent-info">
      <h3 class="agent-name">{{ agent.name }}</h3>
      <div class="agent-metrics">
        <div class="metric">
          <span class="metric-label">Tasks:</span>
          <span class="metric-value">{{ agent.metrics.tasksCompleted }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">CPU:</span>
          <span class="metric-value">{{ agent.metrics.cpuUsage }}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Memory:</span>
          <span class="metric-value">{{ agent.metrics.memoryUsage }}%</span>
        </div>
      </div>
    </div>

    <!-- Connection Indicators -->
    <div v-if="connections.length > 0" class="connection-indicators">
      <div 
        v-for="conn in connections.slice(0, 3)"
        :key="conn.id"
        class="connection-dot"
        :class="`type-${conn.type}`"
        :title="`Connected to ${conn.targetAgentId}`"
      ></div>
      <span v-if="connections.length > 3" class="more-connections">
        +{{ connections.length - 3 }}
      </span>
    </div>

    <!-- Hover Tooltip -->
    <div v-if="showTooltip" class="agent-tooltip">
      <div class="tooltip-content">
        <p><strong>ID:</strong> {{ agent.id }}</p>
        <p><strong>Type:</strong> {{ agent.type }}</p>
        <p><strong>Status:</strong> {{ agent.status }}</p>
        <p><strong>Uptime:</strong> {{ formatUptime(agent.uptime) }}</p>
        <p><strong>Last Activity:</strong> {{ formatTime(agent.lastActivity) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AnimatedLogo from './AnimatedLogo.vue';
import type { Agent, AgentConnection } from '../../../../types/dashboard.types';

interface Props {
  agent: Agent;
  connections: AgentConnection[];
  isSelected: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [];
  'connection-hover': [connectionId: string | null];
}>();

// State
const isHovered = ref(false);
const showTooltip = ref(false);

// Methods
const handleMouseEnter = () => {
  isHovered.value = true;
  setTimeout(() => {
    if (isHovered.value) {
      showTooltip.value = true;
    }
  }, 500);
};

const handleMouseLeave = () => {
  isHovered.value = false;
  showTooltip.value = false;
  emit('connection-hover', null);
};

const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatTime = (timestamp: Date): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};
</script>

<style scoped>
.agent-logo-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--theme-bg-primary);
  border: 2px solid var(--theme-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.agent-logo-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--theme-primary);
}

.agent-logo-row.is-selected {
  border-color: var(--theme-primary);
  background: var(--theme-primary-light);
}

/* Logo Container */
.logo-container {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

/* Status Ring */
.status-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  opacity: 0.8;
}

.status-ring.status-active {
  background: radial-gradient(circle, transparent 60%, #22c55e 70%);
}

.status-ring.status-idle {
  background: radial-gradient(circle, transparent 60%, #6b7280 70%);
}

.status-ring.status-error {
  background: radial-gradient(circle, transparent 60%, #ef4444 70%);
}

.ring-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-active .ring-pulse {
  background: radial-gradient(circle, transparent 60%, #22c55e 70%);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}

/* Agent Logo */
.agent-logo {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--theme-bg-secondary);
  overflow: hidden;
}

/* Activity Pulse */
.activity-pulse {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
}

.pulse-dot {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #3b82f6;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Agent Info */
.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--theme-text-primary);
}

.agent-metrics {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.metric {
  display: flex;
  gap: 0.25rem;
}

.metric-label {
  color: var(--theme-text-secondary);
}

.metric-value {
  font-weight: 500;
  color: var(--theme-text-primary);
}

/* Connection Indicators */
.connection-indicators {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.connection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme-primary);
}

.connection-dot.type-data {
  background: #3b82f6;
}

.connection-dot.type-command {
  background: #8b5cf6;
}

.connection-dot.type-sync {
  background: #10b981;
}

.more-connections {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  padding-left: 0.25rem;
}

/* Tooltip */
.agent-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  background: var(--theme-bg-tertiary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  white-space: nowrap;
}

.tooltip-content {
  font-size: 0.875rem;
}

.tooltip-content p {
  margin: 0.25rem 0;
}

.tooltip-content strong {
  color: var(--theme-text-primary);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .agent-logo-row {
    background: #1e293b;
    border-color: #334155;
  }

  .agent-logo-row.is-selected {
    background: rgba(59, 130, 246, 0.1);
  }

  .agent-logo {
    background: #0f172a;
  }

  .agent-tooltip {
    background: #0f172a;
    border-color: #334155;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .agent-logo-row {
    padding: 0.75rem;
  }

  .logo-container {
    width: 48px;
    height: 48px;
  }

  .agent-metrics {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>