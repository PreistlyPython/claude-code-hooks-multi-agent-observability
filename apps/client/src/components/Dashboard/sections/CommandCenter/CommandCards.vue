<template>
  <div class="command-cards">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading commands...</p>
    </div>
    
    <div v-else-if="commands.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No commands found</h3>
      <p>Commands will appear here as cards when agents execute tasks.</p>
    </div>
    
    <div v-else class="cards-container">
      <div
        v-for="command in commands"
        :key="command.id"
        class="command-card"
        :class="`status-${command.status}`"
      >
        <div class="card-header">
          <div class="command-type">{{ command.type }}</div>
          <StatusBadge :status="command.status" />
        </div>
        
        <div class="card-body">
          <div class="agent-info">
            <span class="agent-label">Agent:</span>
            <span class="agent-id">{{ command.agentId }}</span>
          </div>
          
          <div class="timestamp-info">
            <span class="timestamp-label">Started:</span>
            <span class="timestamp">{{ formatTimestamp(command.timestamp) }}</span>
          </div>
          
          <div v-if="command.duration" class="duration-info">
            <span class="duration-label">Duration:</span>
            <span class="duration">{{ formatDuration(command.duration) }}</span>
          </div>
          
          <div v-if="command.parameters" class="parameters">
            <details>
              <summary>Parameters</summary>
              <pre>{{ JSON.stringify(command.parameters, null, 2) }}</pre>
            </details>
          </div>
          
          <div v-if="command.output" class="output">
            <details>
              <summary>Output</summary>
              <pre>{{ command.output }}</pre>
            </details>
          </div>
          
          <div v-if="command.error" class="error">
            <details>
              <summary>Error</summary>
              <pre class="error-text">{{ command.error }}</pre>
            </details>
          </div>
        </div>
        
        <div class="card-footer">
          <div class="action-buttons">
            <button
              v-if="command.status === 'failed'"
              @click="retryCommand(command)"
              class="action-btn retry-btn"
            >
              Retry
            </button>
            <button
              v-if="command.status === 'running' || command.status === 'queued'"
              @click="cancelCommand(command)"
              class="action-btn cancel-btn"
            >
              Cancel
            </button>
            <button
              @click="viewDetails(command)"
              class="action-btn details-btn"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

// Methods (same as CommandTable)
const formatTimestamp = (timestamp: Date): string => {
  return new Date(timestamp).toLocaleString();
};

const formatDuration = (duration?: number): string => {
  if (!duration) return '-';
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(1)}s`;
};

const retryCommand = (command: Command) => {
  emit('command-action', { command, type: 'retry' });
};

const cancelCommand = (command: Command) => {
  emit('command-action', { command, type: 'cancel' });
};

const viewDetails = (command: Command) => {
  emit('command-action', { command, type: 'details' });
};
</script>

<style scoped>
.command-cards {
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

.cards-container {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.command-card {
  background: var(--theme-bg-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
}

.command-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--theme-bg-secondary);
  border-bottom: 1px solid var(--theme-border);
}

.command-type {
  font-weight: 600;
  color: var(--theme-text-primary);
}

.card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.agent-info,
.timestamp-info,
.duration-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.agent-label,
.timestamp-label,
.duration-label {
  color: var(--theme-text-secondary);
}

.agent-id,
.timestamp,
.duration {
  color: var(--theme-text-primary);
  font-family: monospace;
}

.parameters,
.output,
.error {
  font-size: 0.75rem;
}

.parameters details,
.output details,
.error details {
  cursor: pointer;
}

.parameters summary,
.output summary,
.error summary {
  color: var(--theme-text-secondary);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.parameters pre,
.output pre,
.error pre {
  background: var(--theme-bg-tertiary);
  padding: 0.5rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  font-size: 0.7rem;
  margin: 0;
}

.error-text {
  color: #EF4444;
}

.card-footer {
  padding: 1rem;
  background: var(--theme-bg-secondary);
  border-top: 1px solid var(--theme-border);
}

.action-buttons {
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

.cancel-btn {
  background: #EF4444;
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

/* Status-based card styling */
.status-running {
  border-left: 4px solid #3B82F6;
}

.status-completed {
  border-left: 4px solid #10B981;
}

.status-failed {
  border-left: 4px solid #EF4444;
}

.status-queued {
  border-left: 4px solid #F59E0B;
}

.status-cancelled {
  border-left: 4px solid #6B7280;
  opacity: 0.8;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }

  .card-header,
  .card-body,
  .card-footer {
    padding: 0.75rem;
  }
}
</style>