<template>
  <div class="dashboard-basic">
    <!-- Header -->
    <header class="dashboard-header">
      <h1>Enhanced Multi-Agent Dashboard</h1>
      <button @click="generateMockData" class="refresh-btn">🔄 Generate Mock Data</button>
    </header>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Active Agents</h3>
        <div class="stat-value">{{ mockAgents.length }}</div>
      </div>
      <div class="stat-card">
        <h3>Running Commands</h3>
        <div class="stat-value">{{ runningCommands }}</div>
      </div>
      <div class="stat-card">
        <h3>Completed Today</h3>
        <div class="stat-value">{{ completedToday }}</div>
      </div>
      <div class="stat-card">
        <h3>Success Rate</h3>
        <div class="stat-value">{{ successRate }}%</div>
      </div>
    </div>

    <!-- Agents Section -->
    <section class="dashboard-section">
      <h2>Active Agents</h2>
      <div class="agents-grid">
        <div 
          v-for="agent in mockAgents" 
          :key="agent.id"
          class="agent-card"
          :class="agent.status"
          @click="selectAgent = agent"
        >
          <div class="agent-avatar">🤖</div>
          <div class="agent-info">
            <h4>{{ agent.name }}</h4>
            <p class="agent-type">{{ agent.type }}</p>
            <div class="agent-metrics">
              <span>CPU: {{ agent.cpu }}%</span>
              <span>Memory: {{ agent.memory }}%</span>
            </div>
          </div>
          <div class="status-indicator" :class="agent.status"></div>
        </div>
      </div>
    </section>

    <!-- Commands Section -->
    <section class="dashboard-section">
      <h2>Recent Commands</h2>
      <div class="commands-table">
        <div class="table-header">
          <span>Command</span>
          <span>Agent</span>
          <span>Status</span>
          <span>Duration</span>
        </div>
        <div 
          v-for="command in mockCommands.slice(0, 10)" 
          :key="command.id"
          class="table-row"
        >
          <span>{{ command.name }}</span>
          <span>{{ command.agent }}</span>
          <span class="status-badge" :class="command.status">{{ command.status }}</span>
          <span>{{ command.duration }}ms</span>
        </div>
      </div>
    </section>

    <!-- Logs Section -->
    <section class="dashboard-section">
      <h2>System Logs</h2>
      <div class="logs-container">
        <div 
          v-for="log in mockLogs.slice(0, 8)" 
          :key="log.id"
          class="log-entry"
          :class="log.level"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </section>

    <!-- Agent Details Modal -->
    <div v-if="selectAgent" class="modal-overlay" @click="selectAgent = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectAgent.name }}</h3>
          <button @click="selectAgent = null">✕</button>
        </div>
        <div class="modal-body">
          <p><strong>Type:</strong> {{ selectAgent.type }}</p>
          <p><strong>Status:</strong> {{ selectAgent.status }}</p>
          <p><strong>CPU Usage:</strong> {{ selectAgent.cpu }}%</p>
          <p><strong>Memory Usage:</strong> {{ selectAgent.memory }}%</p>
          <p><strong>Uptime:</strong> {{ selectAgent.uptime }} hours</p>
          <p><strong>Tasks Completed:</strong> {{ selectAgent.tasks }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Mock data
const mockAgents = ref([
  {
    id: 'agent-1',
    name: 'Research Agent Alpha',
    type: 'Research',
    status: 'active',
    cpu: 65,
    memory: 42,
    uptime: 12,
    tasks: 45
  },
  {
    id: 'agent-2',
    name: 'Analysis Bot Beta',
    type: 'Analysis',
    status: 'active',
    cpu: 32,
    memory: 28,
    uptime: 8,
    tasks: 23
  },
  {
    id: 'agent-3',
    name: 'Execution Worker',
    type: 'Execution',
    status: 'idle',
    cpu: 15,
    memory: 18,
    uptime: 24,
    tasks: 67
  },
  {
    id: 'agent-4',
    name: 'Monitor Gamma',
    type: 'Monitoring',
    status: 'active',
    cpu: 78,
    memory: 55,
    uptime: 6,
    tasks: 12
  },
  {
    id: 'agent-5',
    name: 'Coordinator Delta',
    type: 'Coordination',
    status: 'error',
    cpu: 0,
    memory: 5,
    uptime: 0,
    tasks: 89
  }
]);

const mockCommands = ref([
  { id: 1, name: 'data-analysis', agent: 'Agent Alpha', status: 'completed', duration: 1250 },
  { id: 2, name: 'file-processing', agent: 'Agent Beta', status: 'running', duration: 0 },
  { id: 3, name: 'model-training', agent: 'Agent Gamma', status: 'completed', duration: 8900 },
  { id: 4, name: 'data-export', agent: 'Agent Delta', status: 'failed', duration: 450 },
  { id: 5, name: 'report-generation', agent: 'Agent Alpha', status: 'completed', duration: 2100 },
  { id: 6, name: 'system-check', agent: 'Agent Monitor', status: 'running', duration: 0 },
  { id: 7, name: 'backup-data', agent: 'Agent Beta', status: 'queued', duration: 0 },
  { id: 8, name: 'cleanup-logs', agent: 'Agent Gamma', status: 'completed', duration: 340 }
]);

const mockLogs = ref([
  { id: 1, level: 'info', message: 'System initialized successfully', timestamp: new Date(Date.now() - 60000) },
  { id: 2, level: 'info', message: 'Agent Alpha connected', timestamp: new Date(Date.now() - 120000) },
  { id: 3, level: 'warn', message: 'High memory usage detected on Agent Gamma', timestamp: new Date(Date.now() - 180000) },
  { id: 4, level: 'error', message: 'Agent Delta connection failed', timestamp: new Date(Date.now() - 240000) },
  { id: 5, level: 'info', message: 'Data processing completed', timestamp: new Date(Date.now() - 300000) },
  { id: 6, level: 'info', message: 'Backup process started', timestamp: new Date(Date.now() - 360000) },
  { id: 7, level: 'warn', message: 'Slow response from external API', timestamp: new Date(Date.now() - 420000) },
  { id: 8, level: 'info', message: 'System health check passed', timestamp: new Date(Date.now() - 480000) }
]);

const selectAgent = ref(null);

// Computed stats
const runningCommands = computed(() => 
  mockCommands.value.filter(cmd => cmd.status === 'running').length
);

const completedToday = computed(() => 
  mockCommands.value.filter(cmd => cmd.status === 'completed').length
);

const successRate = computed(() => {
  const total = mockCommands.value.length;
  const completed = mockCommands.value.filter(cmd => cmd.status === 'completed').length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
});

// Methods
const generateMockData = () => {
  // Randomize some values to show activity
  mockAgents.value.forEach(agent => {
    if (agent.status === 'active') {
      agent.cpu = Math.floor(Math.random() * 40) + 20;
      agent.memory = Math.floor(Math.random() * 30) + 15;
      agent.tasks += Math.floor(Math.random() * 3);
    }
  });
  
  // Add a new log entry
  const messages = [
    'Task execution completed',
    'New agent connection established',
    'Data synchronization in progress',
    'Performance metrics updated',
    'System optimization applied'
  ];
  
  mockLogs.value.unshift({
    id: Date.now(),
    level: 'info',
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: new Date()
  });
  
  // Keep only last 10 logs
  if (mockLogs.value.length > 10) {
    mockLogs.value = mockLogs.value.slice(0, 10);
  }
};

const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

onMounted(() => {
  // Auto-refresh data every 30 seconds
  setInterval(generateMockData, 30000);
});
</script>

<style scoped>
.dashboard-basic {
  min-height: 100vh;
  background: var(--theme-bg-primary, #f8fafc);
  color: var(--theme-text-primary, #1e293b);
  padding: 1rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem 0;
  border-bottom: 2px solid var(--theme-border, #e2e8f0);
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.refresh-btn {
  padding: 0.75rem 1.5rem;
  background: var(--theme-primary, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: var(--theme-primary-dark, #2563eb);
  transform: translateY(-1px);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--theme-bg-secondary, white);
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--theme-border, #e2e8f0);
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--theme-primary, #3b82f6);
}

/* Dashboard Sections */
.dashboard-section {
  background: var(--theme-bg-secondary, white);
  border-radius: 0.75rem;
  border: 1px solid var(--theme-border, #e2e8f0);
  margin-bottom: 2rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dashboard-section h2 {
  margin: 0;
  padding: 1.5rem;
  background: var(--theme-bg-tertiary, #f1f5f9);
  border-bottom: 1px solid var(--theme-border, #e2e8f0);
  font-size: 1.25rem;
  font-weight: 600;
}

/* Agents Grid */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.agent-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  background: var(--theme-bg-primary, #f8fafc);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.agent-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.agent-card.active {
  border-color: #10b981;
  background: #f0fdf4;
}

.agent-card.idle {
  border-color: #6b7280;
  background: #f9fafb;
}

.agent-card.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.agent-avatar {
  font-size: 2.5rem;
  margin-right: 1rem;
}

.agent-info {
  flex: 1;
}

.agent-info h4 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.agent-type {
  margin: 0 0 0.5rem 0;
  color: var(--theme-text-secondary, #64748b);
  font-size: 0.875rem;
}

.agent-metrics {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--theme-text-secondary, #64748b);
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.status-indicator.active { background: #10b981; }
.status-indicator.idle { background: #6b7280; }
.status-indicator.error { background: #ef4444; }

/* Commands Table */
.commands-table {
  padding: 1.5rem;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  align-items: center;
}

.table-header {
  font-weight: 600;
  border-bottom: 1px solid var(--theme-border, #e2e8f0);
  color: var(--theme-text-secondary, #64748b);
  font-size: 0.875rem;
}

.table-row {
  border-bottom: 1px solid var(--theme-border, #e2e8f0);
}

.table-row:last-child {
  border-bottom: none;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  text-align: center;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.running {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.failed {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.queued {
  background: #fef3c7;
  color: #92400e;
}

/* Logs Container */
.logs-container {
  padding: 1.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

.log-entry {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--theme-border, #e2e8f0);
  align-items: baseline;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: var(--theme-text-secondary, #64748b);
  min-width: 80px;
  font-size: 0.75rem;
}

.log-level {
  min-width: 60px;
  font-weight: 600;
  font-size: 0.75rem;
}

.log-entry.info .log-level { color: #3b82f6; }
.log-entry.warn .log-level { color: #f59e0b; }
.log-entry.error .log-level { color: #ef4444; }

.log-message {
  flex: 1;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--theme-bg-secondary, white);
  border-radius: 0.75rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--theme-border, #e2e8f0);
}

.modal-header h3 {
  margin: 0;
  font-weight: 600;
}

.modal-header button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--theme-text-secondary, #64748b);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0.75rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-basic {
    padding: 0.5rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .agents-grid {
    grid-template-columns: 1fr;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .table-header {
    display: none;
  }
  
  .table-row {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: var(--theme-bg-primary, #f8fafc);
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    border: none;
  }
}
</style>