<template>
  <div class="command-table">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading commands...</p>
    </div>
    
    <div v-else-if="commands.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No commands found</h3>
      <p>Commands will appear here when agents start executing tasks.</p>
    </div>
    
    <div v-else class="table-container">
      <table class="commands-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Agent</th>
            <th>Command</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="command in commands"
            :key="command.id"
            class="command-row"
            :class="`status-${command.status}`"
          >
            <td class="timestamp-cell">
              {{ formatTimestamp(command.timestamp) }}
            </td>
            <td class="agent-cell">
              <span class="agent-badge">{{ command.agentId }}</span>
            </td>
            <td class="command-cell">
              <div class="command-info">
                <span class="command-type">{{ command.type }}</span>
                <span v-if="command.parameters" class="command-params">
                  {{ truncateParams(command.parameters) }}
                </span>
              </div>
            </td>
            <td class="status-cell">
              <StatusBadge :status="command.status" />
            </td>
            <td class="duration-cell">
              {{ formatDuration(command.duration) }}
            </td>
            <td class="actions-cell">
              <div class="action-buttons">
                <button
                  v-if="command.status === 'failed'"
                  @click="retryCommand(command)"
                  class="action-btn retry-btn"
                  title="Retry command"
                >
                  🔄
                </button>
                <button
                  v-if="command.status === 'running' || command.status === 'queued'"
                  @click="cancelCommand(command)"
                  class="action-btn cancel-btn"
                  title="Cancel command"
                >
                  ❌
                </button>
                <button
                  @click="viewDetails(command)"
                  class="action-btn details-btn"
                  title="View details"
                >
                  👁️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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

// Methods
const formatTimestamp = (timestamp: Date): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const formatDuration = (duration?: number): string => {
  if (!duration) return '-';
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(1)}s`;
};

const truncateParams = (params: Record<string, any>): string => {
  const str = JSON.stringify(params);
  return str.length > 50 ? str.substring(0, 47) + '...' : str;
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
.command-table {
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

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--theme-border);
  border-top: 3px solid var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.table-container {
  flex: 1;
  overflow-y: auto;
}

.commands-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.commands-table th {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-primary);
  font-weight: 600;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 2px solid var(--theme-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.command-row {
  border-bottom: 1px solid var(--theme-border);
  transition: background-color 0.2s;
}

.command-row:hover {
  background: var(--theme-bg-secondary);
}

.command-row td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
}

.timestamp-cell {
  color: var(--theme-text-secondary);
  font-family: monospace;
  font-size: 0.8rem;
}

.agent-badge {
  background: var(--theme-primary);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.command-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.command-type {
  font-weight: 500;
  color: var(--theme-text-primary);
}

.command-params {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  font-family: monospace;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.retry-btn {
  background: #10B981;
  color: white;
}

.retry-btn:hover {
  background: #059669;
}

.cancel-btn {
  background: #EF4444;
  color: white;
}

.cancel-btn:hover {
  background: #DC2626;
}

.details-btn {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-primary);
}

.details-btn:hover {
  background: var(--theme-primary);
  color: white;
}

/* Status-based row styling */
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
  opacity: 0.7;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .commands-table th {
    background: #1e293b;
  }

  .command-row:hover {
    background: #1e293b;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .commands-table {
    font-size: 0.75rem;
  }

  .commands-table th,
  .command-row td {
    padding: 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }

  .action-btn {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.75rem;
  }
}
</style>