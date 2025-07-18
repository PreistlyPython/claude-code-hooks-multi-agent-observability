<template>
  <div class="command-timeline">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading timeline...</p>
    </div>
    
    <div v-else-if="commands.length === 0" class="empty-state">
      <div class="empty-icon">📈</div>
      <h3>No commands in timeline</h3>
      <p>Command execution timeline will appear here.</p>
    </div>
    
    <div v-else class="timeline-container">
      <div class="timeline">
        <div
          v-for="(command, index) in sortedCommands"
          :key="command.id"
          class="timeline-item"
          :class="`status-${command.status}`"
        >
          <div class="timeline-marker">
            <div class="marker-dot" :class="`status-${command.status}`"></div>
            <div v-if="index < sortedCommands.length - 1" class="marker-line"></div>
          </div>
          
          <div class="timeline-content">
            <div class="timeline-card">
              <div class="card-header">
                <div class="command-info">
                  <span class="command-type">{{ command.type }}</span>
                  <span class="agent-id">{{ command.agentId }}</span>
                </div>
                <div class="timestamp">
                  {{ formatTimestamp(command.timestamp) }}
                </div>
              </div>
              
              <div class="card-body">
                <div class="status-info">
                  <StatusBadge :status="command.status" />
                  <span v-if="command.duration" class="duration">
                    {{ formatDuration(command.duration) }}
                  </span>
                </div>
                
                <div v-if="command.parameters" class="parameters">
                  <summary>Parameters</summary>
                  <div class="params-preview">
                    {{ truncateParams(command.parameters) }}
                  </div>
                </div>
                
                <div v-if="command.error" class="error-info">
                  <span class="error-label">Error:</span>
                  <span class="error-message">{{ command.error }}</span>
                </div>
              </div>
              
              <div class="card-actions">
                <button
                  v-if="command.status === 'failed'"
                  @click="retryCommand(command)"
                  class="action-btn retry-btn"
                >
                  🔄 Retry
                </button>
                <button
                  @click="viewDetails(command)"
                  class="action-btn details-btn"
                >
                  👁️ Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatusBadge from './StatusBadge.vue';
import type { Command } from '../../../../types/dashboard.types';

interface Props {
  commands: Command[];
  loading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'command-action': [action: { command: Command; type: string }];
}>();

// Computed
const sortedCommands = computed(() => {
  return [...props.commands].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
});

// Methods
const formatTimestamp = (timestamp: Date): string => {
  return new Date(timestamp).toLocaleString();
};

const formatDuration = (duration?: number): string => {
  if (!duration) return '';
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(1)}s`;
};

const truncateParams = (params: Record<string, any>): string => {
  const str = JSON.stringify(params);
  return str.length > 100 ? str.substring(0, 97) + '...' : str;
};

const retryCommand = (command: Command) => {
  emit('command-action', { command, type: 'retry' });
};

const viewDetails = (command: Command) => {
  emit('command-action', { command, type: 'details' });
};
</script>

<style scoped>
.command-timeline {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.timeline-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline-item {
  position: relative;
  display: flex;
  margin-bottom: 2rem;
}

.timeline-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 1rem;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--theme-bg-primary);
  z-index: 2;
}

.marker-dot.status-queued {
  background: #F59E0B;
}

.marker-dot.status-running {
  background: #3B82F6;
  animation: pulse 2s infinite;
}

.marker-dot.status-completed {
  background: #10B981;
}

.marker-dot.status-failed {
  background: #EF4444;
}

.marker-dot.status-cancelled {
  background: #6B7280;
}

.marker-line {
  width: 2px;
  flex: 1;
  background: var(--theme-border);
  margin-top: 0.5rem;
}

.timeline-content {
  flex: 1;
}

.timeline-card {
  background: var(--theme-bg-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
}

.timeline-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--theme-bg-secondary);
  border-bottom: 1px solid var(--theme-border);
}

.command-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.command-type {
  font-weight: 600;
  color: var(--theme-text-primary);
}

.agent-id {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  font-family: monospace;
}

.timestamp {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  font-family: monospace;
}

.card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.duration {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  font-family: monospace;
}

.parameters summary {
  color: var(--theme-text-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  cursor: pointer;
}

.params-preview {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--theme-text-primary);
  background: var(--theme-bg-tertiary);
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.error-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-label {
  font-size: 0.875rem;
  color: #EF4444;
  font-weight: 500;
}

.error-message {
  font-size: 0.875rem;
  color: #EF4444;
  font-family: monospace;
  background: #FEE2E2;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.card-actions {
  padding: 1rem;
  background: var(--theme-bg-secondary);
  border-top: 1px solid var(--theme-border);
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.retry-btn {
  background: #10B981;
  color: white;
}

.details-btn {
  background: var(--theme-primary);
  color: white;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .timeline-container {
    padding: 0.5rem;
  }

  .timeline-item {
    margin-bottom: 1rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .card-body,
  .card-actions {
    padding: 0.75rem;
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .error-message {
    background: #7F1D1D;
    color: #FCA5A5;
  }
}
</style>