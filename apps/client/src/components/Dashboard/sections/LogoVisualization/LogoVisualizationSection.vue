<template>
  <div class="logo-visualization-section" :class="{ 'auto-arrange': autoArrange }">
    <div class="agents-grid" :class="`layout-${layoutMode}`">
      <AgentLogoRow
        v-for="agent in agents"
        :key="agent.id"
        :agent="agent"
        :connections="getAgentConnections(agent.id)"
        :is-selected="selectedAgentId === agent.id"
        @click="$emit('agent-click', agent)"
        @connection-hover="handleConnectionHover"
      />
    </div>
    
    <!-- Connection Overlay -->
    <svg
      v-if="showConnections"
      class="connections-overlay"
      :viewBox="`0 0 ${containerWidth} ${containerHeight}`"
    >
      <ConnectionLine
        v-for="connection in visibleConnections"
        :key="connection.id"
        :connection="connection"
        :source-position="getAgentPosition(connection.sourceAgentId)"
        :target-position="getAgentPosition(connection.targetAgentId)"
        :is-highlighted="isConnectionHighlighted(connection)"
        @click="$emit('connection-click', connection)"
      />
    </svg>

    <!-- Zoom Controls -->
    <div class="zoom-controls">
      <button @click="zoomIn" class="zoom-button">+</button>
      <button @click="resetZoom" class="zoom-button">Reset</button>
      <button @click="zoomOut" class="zoom-button">-</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import AgentLogoRow from './AgentLogoRow.vue';
import ConnectionLine from './ConnectionLine.vue';
import { useAgentPositions } from '../../../../composables/useAgentPositions';
import type { Agent, AgentConnection } from '../../../../types/dashboard.types';

interface Props {
  agents: Agent[];
  connections: AgentConnection[];
  layoutMode: 'grid' | 'list';
  autoArrange: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'agent-click': [agent: Agent];
  'connection-click': [connection: AgentConnection];
}>();

// State
const selectedAgentId = ref<string | null>(null);
const highlightedConnectionId = ref<string | null>(null);
const containerWidth = ref(1200);
const containerHeight = ref(600);
const zoomLevel = ref(1);
const showConnections = ref(true);

// Use agent positions composable
const { agentPositions, updatePositions, getAgentPosition } = useAgentPositions();

// Computed
const visibleConnections = computed(() => {
  if (!showConnections.value) return [];
  
  return props.connections.filter(conn => {
    const sourceAgent = props.agents.find(a => a.id === conn.sourceAgentId);
    const targetAgent = props.agents.find(a => a.id === conn.targetAgentId);
    return sourceAgent?.status === 'active' && targetAgent?.status === 'active';
  });
});

// Methods
const getAgentConnections = (agentId: string) => {
  return props.connections.filter(
    conn => conn.sourceAgentId === agentId || conn.targetAgentId === agentId
  );
};

const isConnectionHighlighted = (connection: AgentConnection) => {
  return connection.id === highlightedConnectionId.value ||
    (selectedAgentId.value && (
      connection.sourceAgentId === selectedAgentId.value ||
      connection.targetAgentId === selectedAgentId.value
    ));
};

const handleConnectionHover = (connectionId: string | null) => {
  highlightedConnectionId.value = connectionId;
};

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.5);
};

const resetZoom = () => {
  zoomLevel.value = 1;
};

// Update container dimensions
const updateContainerDimensions = () => {
  const container = document.querySelector('.logo-visualization-section');
  if (container) {
    containerWidth.value = container.clientWidth;
    containerHeight.value = container.clientHeight;
  }
};

// Watch for agent changes and update positions
watch(() => props.agents, () => {
  if (props.autoArrange) {
    updatePositions(props.agents, props.layoutMode);
  }
}, { deep: true });

// Lifecycle
onMounted(() => {
  updateContainerDimensions();
  window.addEventListener('resize', updateContainerDimensions);
  
  if (props.autoArrange) {
    updatePositions(props.agents, props.layoutMode);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerDimensions);
});
</script>

<style scoped>
.logo-visualization-section {
  position: relative;
  min-height: 400px;
  padding: 1.5rem;
  overflow: hidden;
}

/* Grid Layouts */
.agents-grid {
  position: relative;
  z-index: 2;
}

.agents-grid.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.agents-grid.layout-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Connections Overlay */
.connections-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.connections-overlay :deep(path) {
  pointer-events: auto;
}

/* Zoom Controls */
.zoom-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  background: var(--theme-bg-tertiary);
  border-radius: 0.375rem;
  padding: 0.25rem;
  border: 1px solid var(--theme-border);
  z-index: 10;
}

.zoom-button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.zoom-button:hover {
  background: var(--theme-primary);
  color: white;
}

/* Auto-arrange animation */
.auto-arrange .agents-grid {
  transition: all 0.5s ease-in-out;
}

/* Responsive Design */
@media (max-width: 768px) {
  .logo-visualization-section {
    min-height: 300px;
    padding: 1rem;
  }

  .agents-grid.layout-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .zoom-controls {
    bottom: 0.5rem;
    right: 0.5rem;
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .zoom-controls {
    background: #1e293b;
    border-color: #334155;
  }

  .zoom-button {
    background: #0f172a;
    color: #e2e8f0;
    border-color: #334155;
  }

  .zoom-button:hover {
    background: #3b82f6;
  }
}
</style>