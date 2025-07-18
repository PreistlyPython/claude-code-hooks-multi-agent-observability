<template>
  <g 
    class="connection-line"
    :class="{ 
      'is-highlighted': isHighlighted,
      'is-active': connection.status === 'active',
      'is-error': connection.status === 'error'
    }"
    @click="$emit('click')"
  >
    <!-- Main Connection Path -->
    <path
      :d="pathData"
      class="connection-path"
      :stroke="getConnectionColor()"
      :stroke-width="getStrokeWidth()"
      :stroke-dasharray="getDashArray()"
      fill="none"
      stroke-linecap="round"
    />
    
    <!-- Data Flow Animation -->
    <g v-if="connection.status === 'active' && showFlow">
      <circle
        :r="flowDotSize"
        :fill="getConnectionColor()"
        class="flow-dot"
      >
        <animateMotion
          :dur="flowSpeed"
          repeatCount="indefinite"
          :path="pathData"
        />
      </circle>
    </g>
    
    <!-- Bandwidth Indicator -->
    <g v-if="showBandwidth && connection.bandwidth > 0">
      <path
        :d="pathData"
        :stroke="getConnectionColor()"
        :stroke-width="getBandwidthWidth()"
        stroke-opacity="0.3"
        fill="none"
        stroke-linecap="round"
      />
    </g>
    
    <!-- Connection Labels -->
    <g v-if="showLabels">
      <text
        :x="midpoint.x"
        :y="midpoint.y - 5"
        text-anchor="middle"
        class="connection-label"
        :fill="getConnectionColor()"
      >
        {{ getConnectionTypeLabel() }}
      </text>
      <text
        :x="midpoint.x"
        :y="midpoint.y + 10"
        text-anchor="middle"
        class="connection-stats"
        fill="#666"
      >
        {{ getStatsLabel() }}
      </text>
    </g>
    
    <!-- Hover Indicator -->
    <path
      v-if="isHighlighted"
      :d="pathData"
      :stroke="getConnectionColor()"
      :stroke-width="getStrokeWidth() + 4"
      stroke-opacity="0.3"
      fill="none"
      stroke-linecap="round"
      class="hover-indicator"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AgentConnection } from '../../../../types/dashboard.types';

interface Props {
  connection: AgentConnection;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  isHighlighted: boolean;
  showFlow?: boolean;
  showBandwidth?: boolean;
  showLabels?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showFlow: true,
  showBandwidth: true,
  showLabels: false
});

const emit = defineEmits<{
  click: [];
}>();

// Connection type colors
const connectionColors = {
  data: '#3B82F6',
  command: '#8B5CF6',
  sync: '#10B981',
  heartbeat: '#6B7280'
};

// Connection status colors
const statusColors = {
  active: '#22C55E',
  inactive: '#6B7280',
  error: '#EF4444'
};

// Computed properties
const pathData = computed(() => {
  const { sourcePosition, targetPosition } = props;
  
  // Calculate control points for curved connection
  const dx = targetPosition.x - sourcePosition.x;
  const dy = targetPosition.y - sourcePosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Create a curved path
  const curvature = Math.min(distance * 0.3, 50);
  const midX = (sourcePosition.x + targetPosition.x) / 2;
  const midY = (sourcePosition.y + targetPosition.y) / 2;
  
  // Perpendicular offset for curve
  const offsetX = -dy * curvature / distance;
  const offsetY = dx * curvature / distance;
  
  const controlX = midX + offsetX;
  const controlY = midY + offsetY;
  
  return `M ${sourcePosition.x} ${sourcePosition.y} Q ${controlX} ${controlY} ${targetPosition.x} ${targetPosition.y}`;
});

const midpoint = computed(() => {
  const { sourcePosition, targetPosition } = props;
  return {
    x: (sourcePosition.x + targetPosition.x) / 2,
    y: (sourcePosition.y + targetPosition.y) / 2
  };
});

const getConnectionColor = () => {
  if (props.connection.status === 'error') {
    return statusColors.error;
  }
  return connectionColors[props.connection.type] || connectionColors.data;
};

const getStrokeWidth = () => {
  const baseWidth = 2;
  const activityMultiplier = props.connection.status === 'active' ? 1.5 : 1;
  const highlightMultiplier = props.isHighlighted ? 1.5 : 1;
  return baseWidth * activityMultiplier * highlightMultiplier;
};

const getBandwidthWidth = () => {
  // Scale bandwidth to visual width (1-10 pixels)
  const maxBandwidth = 1000; // MB/s
  const normalizedBandwidth = Math.min(props.connection.bandwidth / maxBandwidth, 1);
  return 2 + (normalizedBandwidth * 8);
};

const getDashArray = () => {
  switch (props.connection.type) {
    case 'heartbeat':
      return '5,5';
    case 'sync':
      return '3,3';
    default:
      return 'none';
  }
};

const getConnectionTypeLabel = () => {
  return props.connection.type.toUpperCase();
};

const getStatsLabel = () => {
  const latency = props.connection.latency.toFixed(0);
  const bandwidth = props.connection.bandwidth > 1000 
    ? `${(props.connection.bandwidth / 1000).toFixed(1)}GB/s`
    : `${props.connection.bandwidth.toFixed(0)}MB/s`;
  return `${latency}ms | ${bandwidth}`;
};

const flowSpeed = computed(() => {
  // Speed based on connection activity
  const baseSpeed = 4; // seconds
  const activityMultiplier = props.connection.messageCount > 100 ? 0.5 : 1;
  return `${baseSpeed * activityMultiplier}s`;
});

const flowDotSize = computed(() => {
  return props.connection.status === 'active' ? 3 : 2;
});
</script>

<style scoped>
.connection-line {
  cursor: pointer;
  transition: all 0.3s ease;
}

.connection-path {
  transition: all 0.3s ease;
}

.connection-line.is-highlighted .connection-path {
  filter: drop-shadow(0 0 6px currentColor);
}

.connection-line.is-active .connection-path {
  stroke-opacity: 1;
}

.connection-line.is-error .connection-path {
  stroke-dasharray: 5,5;
  animation: errorPulse 2s ease-in-out infinite;
}

.flow-dot {
  filter: drop-shadow(0 0 3px currentColor);
}

.connection-label {
  font-size: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.connection-stats {
  font-size: 7px;
  font-family: monospace;
}

.hover-indicator {
  animation: pulseGlow 1.5s ease-in-out infinite;
}

@keyframes errorPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes pulseGlow {
  0%, 100% { stroke-opacity: 0.1; }
  50% { stroke-opacity: 0.5; }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .connection-stats {
    fill: #9CA3AF;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .flow-dot animateMotion,
  .connection-line.is-error .connection-path,
  .hover-indicator {
    animation: none;
  }
}
</style>