<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Agent Details: {{ agent.name }}</h2>
        <button @click="$emit('close')" class="close-button">✕</button>
      </div>
      
      <div class="modal-content">
        <div class="agent-info-grid">
          <div class="info-section">
            <h3>Basic Information</h3>
            <div class="info-item">
              <span class="label">ID:</span>
              <span class="value">{{ agent.id }}</span>
            </div>
            <div class="info-item">
              <span class="label">Type:</span>
              <span class="value">{{ agent.type }}</span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <StatusBadge :status="agent.status as any" />
            </div>
            <div class="info-item">
              <span class="label">Version:</span>
              <span class="value">{{ agent.version }}</span>
            </div>
            <div class="info-item">
              <span class="label">Uptime:</span>
              <span class="value">{{ formatUptime(agent.uptime) }}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Performance Metrics</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Tasks Completed</div>
                <div class="metric-value">{{ agent.metrics.tasksCompleted }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">CPU Usage</div>
                <div class="metric-value">{{ agent.metrics.cpuUsage }}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-value">{{ agent.metrics.memoryUsage }}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Avg Response Time</div>
                <div class="metric-value">{{ agent.metrics.averageResponseTime }}ms</div>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Capabilities</h3>
            <div class="capabilities-list">
              <span
                v-for="capability in agent.capabilities"
                :key="capability"
                class="capability-tag"
              >
                {{ capability }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">Close</button>
        <button class="btn btn-primary">View Full Logs</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusBadge from './sections/CommandCenter/StatusBadge.vue';
import type { Agent } from '../../types/dashboard.types';

interface Props {
  agent: Agent;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const handleOverlayClick = () => {
  emit('close');
};

const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-container {
  background: var(--theme-bg-primary);
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--theme-border);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--theme-text-primary);
}

.close-button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--theme-text-secondary);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
}

.modal-content {
  padding: 1.5rem;
}

.agent-info-grid {
  display: grid;
  gap: 2rem;
}

.info-section {
  background: var(--theme-bg-secondary);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.info-section h3 {
  margin: 0 0 1rem 0;
  color: var(--theme-text-primary);
  font-size: 1.125rem;
  font-weight: 600;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--theme-border);
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: var(--theme-text-secondary);
  font-weight: 500;
}

.value {
  color: var(--theme-text-primary);
  font-family: monospace;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: var(--theme-bg-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  padding: 1rem;
  text-align: center;
}

.metric-label {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.capabilities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.capability-tag {
  background: var(--theme-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--theme-border);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
}

.btn-secondary:hover {
  background: var(--theme-bg-tertiary);
}

.btn-primary {
  background: var(--theme-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--theme-primary-dark);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }

  .modal-header,
  .modal-content,
  .modal-footer {
    padding: 1rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>