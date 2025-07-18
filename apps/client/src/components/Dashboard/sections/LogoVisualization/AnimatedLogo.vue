<template>
  <div class="animated-logo" :class="`agent-type-${agentType} agent-status-${status}`">
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      class="logo-svg"
      :class="{ 'is-hovered': isHovered }"
    >
      <!-- Background Circle -->
      <circle
        cx="24"
        cy="24"
        r="22"
        class="logo-background"
        :fill="getBackgroundColor()"
        :stroke="getStrokeColor()"
        stroke-width="2"
      />
      
      <!-- Agent Type Icon -->
      <g class="agent-icon" :class="`icon-${agentType}`">
        <!-- Research Agent -->
        <g v-if="agentType === 'research'">
          <circle cx="24" cy="16" r="3" class="icon-element" />
          <path d="M24 20 L24 32" class="icon-element" stroke-width="2" />
          <path d="M18 26 L30 26" class="icon-element" stroke-width="2" />
          <circle cx="20" cy="30" r="1.5" class="icon-dot" />
          <circle cx="28" cy="30" r="1.5" class="icon-dot" />
        </g>
        
        <!-- Analysis Agent -->
        <g v-else-if="agentType === 'analysis'">
          <rect x="16" y="16" width="16" height="12" rx="2" class="icon-element" />
          <path d="M18 20 L22 24 L30 18" class="icon-element" stroke-width="2" />
          <circle cx="20" cy="32" r="1" class="icon-dot" />
          <circle cx="24" cy="32" r="1" class="icon-dot" />
          <circle cx="28" cy="32" r="1" class="icon-dot" />
        </g>
        
        <!-- Execution Agent -->
        <g v-else-if="agentType === 'execution'">
          <polygon points="18,18 30,24 18,30" class="icon-element" />
          <circle cx="32" cy="20" r="1.5" class="icon-dot" />
          <circle cx="32" cy="24" r="1.5" class="icon-dot" />
          <circle cx="32" cy="28" r="1.5" class="icon-dot" />
        </g>
        
        <!-- Coordination Agent -->
        <g v-else-if="agentType === 'coordination'">
          <circle cx="18" cy="18" r="3" class="icon-element" />
          <circle cx="30" cy="18" r="3" class="icon-element" />
          <circle cx="18" cy="30" r="3" class="icon-element" />
          <circle cx="30" cy="30" r="3" class="icon-element" />
          <path d="M21 21 L27 27" class="icon-element" stroke-width="1.5" />
          <path d="M27 21 L21 27" class="icon-element" stroke-width="1.5" />
        </g>
        
        <!-- Monitoring Agent -->
        <g v-else-if="agentType === 'monitoring'">
          <circle cx="24" cy="24" r="8" class="icon-element" fill="none" />
          <circle cx="24" cy="24" r="4" class="icon-element" />
          <path d="M24 12 L24 16" class="icon-element" stroke-width="2" />
          <path d="M24 32 L24 36" class="icon-element" stroke-width="2" />
          <path d="M12 24 L16 24" class="icon-element" stroke-width="2" />
          <path d="M32 24 L36 24" class="icon-element" stroke-width="2" />
        </g>
        
        <!-- Default/Unknown Agent -->
        <g v-else>
          <circle cx="24" cy="24" r="6" class="icon-element" />
          <text x="24" y="28" text-anchor="middle" font-size="8" class="icon-text">?</text>
        </g>
      </g>
      
      <!-- Status Indicator -->
      <circle
        cx="36"
        cy="12"
        r="4"
        class="status-indicator"
        :fill="getStatusColor()"
      >
        <animate
          v-if="status === 'active'"
          attributeName="r"
          values="3;5;3"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          v-if="status === 'error'"
          attributeName="opacity"
          values="1;0.3;1"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
      
      <!-- Activity Pulse (when active) -->
      <g v-if="status === 'active'" class="activity-pulse">
        <circle cx="24" cy="24" r="20" fill="none" :stroke="getStatusColor()" stroke-width="1" opacity="0.6">
          <animate
            attributeName="r"
            values="15;25;15"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0.1;0.6"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
      
      <!-- Processing Spinner (when processing) -->
      <g v-if="status === 'active'" class="processing-spinner">
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          :stroke="getStatusColor()"
          stroke-width="2"
          stroke-dasharray="20 10"
          opacity="0.8"
        >
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 24 24"
            to="360 24 24"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
      
      <!-- Hover Effect -->
      <circle
        v-if="isHovered"
        cx="24"
        cy="24"
        r="23"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        opacity="0.3"
        class="hover-ring"
      >
        <animate
          attributeName="r"
          values="23;26;23"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
    
    <!-- Activity Dots -->
    <div v-if="status === 'active'" class="activity-dots">
      <div class="activity-dot" style="animation-delay: 0s"></div>
      <div class="activity-dot" style="animation-delay: 0.3s"></div>
      <div class="activity-dot" style="animation-delay: 0.6s"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  agentType: 'research' | 'analysis' | 'execution' | 'coordination' | 'monitoring';
  status: 'active' | 'idle' | 'error' | 'maintenance';
  isHovered: boolean;
}

const props = defineProps<Props>();

// Color schemes for different agent types
const agentColors = {
  research: {
    background: '#3B82F6',
    stroke: '#1E40AF',
    icon: '#FFFFFF'
  },
  analysis: {
    background: '#8B5CF6',
    stroke: '#7C3AED',
    icon: '#FFFFFF'
  },
  execution: {
    background: '#10B981',
    stroke: '#059669',
    icon: '#FFFFFF'
  },
  coordination: {
    background: '#F59E0B',
    stroke: '#D97706',
    icon: '#FFFFFF'
  },
  monitoring: {
    background: '#EF4444',
    stroke: '#DC2626',
    icon: '#FFFFFF'
  }
};

// Status colors
const statusColors = {
  active: '#22C55E',
  idle: '#6B7280',
  error: '#EF4444',
  maintenance: '#F59E0B'
};

const getBackgroundColor = () => {
  const colors = agentColors[props.agentType];
  return props.status === 'error' ? '#FEE2E2' : colors.background;
};

const getStrokeColor = () => {
  const colors = agentColors[props.agentType];
  return props.status === 'error' ? '#EF4444' : colors.stroke;
};

const getStatusColor = () => {
  return statusColors[props.status];
};
</script>

<style scoped>
.animated-logo {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-svg {
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-svg.is-hovered {
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

/* Icon Elements */
.icon-element {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.3s ease;
}

.icon-dot {
  fill: currentColor;
  transition: all 0.3s ease;
}

.icon-text {
  fill: currentColor;
  font-family: system-ui, sans-serif;
  font-weight: 600;
}

/* Agent Type Specific Styles */
.agent-type-research .icon-element,
.agent-type-research .icon-dot,
.agent-type-research .icon-text {
  color: #FFFFFF;
}

.agent-type-analysis .icon-element,
.agent-type-analysis .icon-dot,
.agent-type-analysis .icon-text {
  color: #FFFFFF;
}

.agent-type-execution .icon-element,
.agent-type-execution .icon-dot,
.agent-type-execution .icon-text {
  color: #FFFFFF;
}

.agent-type-coordination .icon-element,
.agent-type-coordination .icon-dot,
.agent-type-coordination .icon-text {
  color: #FFFFFF;
}

.agent-type-monitoring .icon-element,
.agent-type-monitoring .icon-dot,
.agent-type-monitoring .icon-text {
  color: #FFFFFF;
}

/* Status Specific Styles */
.agent-status-error .logo-background {
  fill: #FEE2E2;
  stroke: #EF4444;
}

.agent-status-error .icon-element,
.agent-status-error .icon-dot,
.agent-status-error .icon-text {
  color: #EF4444;
}

.agent-status-maintenance .logo-background {
  opacity: 0.7;
}

.agent-status-idle .logo-background {
  opacity: 0.8;
}

/* Activity Dots */
.activity-dots {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  gap: 2px;
}

.activity-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #22C55E;
  animation: activityPulse 1.5s ease-in-out infinite;
}

@keyframes activityPulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* Hover Effects */
.hover-ring {
  color: #3B82F6;
}

/* Responsive Design */
@media (max-width: 768px) {
  .animated-logo {
    width: 40px;
    height: 40px;
  }

  .logo-svg {
    width: 40px;
    height: 40px;
  }

  .activity-dots {
    top: -2px;
    right: -2px;
  }

  .activity-dot {
    width: 3px;
    height: 3px;
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .logo-svg {
    filter: drop-shadow(0 2px 4px rgba(255, 255, 255, 0.1));
  }

  .logo-svg.is-hovered {
    filter: drop-shadow(0 4px 8px rgba(255, 255, 255, 0.2));
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .logo-svg,
  .activity-dot {
    animation: none;
  }

  .logo-svg.is-hovered {
    transform: none;
  }

  svg animate,
  svg animateTransform {
    animation-duration: 0s;
  }
}
</style>