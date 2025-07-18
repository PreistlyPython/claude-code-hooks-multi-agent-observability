<template>
  <div class="dashboard-layout">
    <!-- Header Section -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">Enhanced Multi-Agent Observability Dashboard</h1>
        <div class="header-controls">
          <button @click="refreshData" class="control-button">
            🔄 Refresh
          </button>
        </div>
      </div>
    </header>

    <!-- Main Dashboard Container -->
    <div class="dashboard-container">
      <!-- Logo Visualization Section -->
      <section class="dashboard-section logo-section">
        <div class="section-header">
          <h2 class="section-title">Active Agents ({{ agents.length }})</h2>
        </div>
        <div class="agents-grid">
          <div
            v-for="agent in safeAgents"
            :key="agent.id"
            class="agent-card"
            :class="`status-${agent.status}`"
            @click="selectAgent(agent)"
          >
            <div class="agent-logo">
              <div class="logo-icon">🤖</div>
              <div class="status-indicator" :class="agent.status"></div>
            </div>
            <div class="agent-info">
              <h3 class="agent-name">{{ agent.name }}</h3>
              <p class="agent-type">{{ agent.type }}</p>
              <div class="agent-metrics">
                <span class="metric">CPU: {{ agent.metrics ? Math.round(agent.metrics.cpuUsage || 0) : 0 }}%</span>
                <span class="metric">Memory: {{ agent.metrics ? Math.round(agent.metrics.memoryUsage || 0) : 0 }}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Command Center Section -->
      <section class="dashboard-section command-section">
        <div class="section-header">
          <h2 class="section-title">Commands ({{ commands.length }})</h2>
          <div class="section-controls">
            <select v-model="commandFilter" class="view-selector">
              <option value="all">All Commands</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <div class="commands-list">
          <div
            v-for="command in safeCommands"
            :key="command.id"
            class="command-row"
            :class="`status-${command.status || 'unknown'}`"
          >
            <div class="command-info">
              <span class="command-type">{{ command.type }}</span>
              <span class="command-agent">{{ command.agentId }}</span>
              <span class="command-time">{{ formatTime(command.timestamp) }}</span>
            </div>
            <div class="command-status">
              <span class="status-badge" :class="command.status">{{ command.status }}</span>
              <span v-if="command.duration" class="duration">{{ Math.round(command.duration) }}ms</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Logs & Metrics Section -->
      <section class="dashboard-section logs-section">
        <div class="section-header">
          <h2 class="section-title">System Logs ({{ systemLogs.length }})</h2>
        </div>
        <div class="logs-container">
          <div
            v-for="log in safeLogs"
            :key="log.id"
            class="log-entry"
            :class="`level-${log.level || 'info'}`"
          >
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-level">{{ (log.level || 'info').toUpperCase() }}</span>
            <span class="log-source">{{ log.source }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Agent Details Modal -->
    <div v-if="selectedAgent" class="modal-overlay" @click="selectedAgent = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedAgent.name }}</h3>
          <button @click="selectedAgent = null" class="close-button">✕</button>
        </div>
        <div class="modal-body">
          <div class="agent-details">
            <p><strong>Type:</strong> {{ selectedAgent.type }}</p>
            <p><strong>Status:</strong> {{ selectedAgent.status }}</p>
            <p><strong>Version:</strong> {{ selectedAgent.version }}</p>
            <p><strong>Uptime:</strong> {{ Math.round(selectedAgent.uptime / 3600) }} hours</p>
            <p><strong>Tasks Completed:</strong> {{ selectedAgent.metrics?.tasksCompleted || 0 }}</p>
            <p><strong>CPU Usage:</strong> {{ selectedAgent.metrics ? Math.round(selectedAgent.metrics.cpuUsage || 0) : 0 }}%</p>
            <p><strong>Memory Usage:</strong> {{ selectedAgent.metrics ? Math.round(selectedAgent.metrics.memoryUsage || 0) : 0 }}%</p>
            <p><strong>Active Connections:</strong> {{ selectedAgent.metrics?.activeConnections || 0 }}</p>
            <p><strong>Error Count:</strong> {{ selectedAgent.metrics?.errorCount || 0 }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getDashboardStore } from '../../composables/useDashboardStore';
import { demoDataGenerator } from '../../utils/demoDataGenerator';
import type { Agent, Command, LogEntry } from '../../types/dashboard.types';

// Store
const dashboardStore = getDashboardStore();

// Local state
const selectedAgent = ref<Agent | null>(null);
const commandFilter = ref('all');

// Data from store
const agents = computed(() => dashboardStore.agents);
const commands = computed(() => dashboardStore.commands);
const systemLogs = computed(() => dashboardStore.state.logs.system || []);

// Safe computed values with null checks
const safeAgents = computed(() => {
  return agents.value.filter(agent => agent && agent.id).map(agent => ({
    ...agent,
    name: agent.name || `Agent ${agent.id}`,
    type: agent.type || 'unknown',
    status: agent.status || 'idle',
    metrics: agent.metrics || {
      tasksCompleted: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      networkActivity: 0,
      diskIO: 0,
      activeConnections: 0,
      errorCount: 0,
      averageResponseTime: 0
    },
    uptime: agent.uptime || 0,
    version: agent.version || '1.0.0'
  }));
});

const safeCommands = computed(() => {
  const filteredCommands = commandFilter.value === 'all' 
    ? commands.value.slice(0, 20)
    : commands.value.filter(cmd => cmd && cmd.status === commandFilter.value).slice(0, 20);
  
  return filteredCommands.filter(cmd => cmd && cmd.id).map(cmd => ({
    ...cmd,
    type: cmd.type || 'unknown',
    agentId: cmd.agentId || 'unknown',
    status: cmd.status || 'queued',
    timestamp: cmd.timestamp || new Date()
  }));
});

const safeLogs = computed(() => {
  return systemLogs.value.filter(log => log && log.id).slice(-20).reverse().map(log => ({
    ...log,
    level: log.level || 'info',
    message: log.message || 'No message',
    source: log.source || 'system',
    timestamp: log.timestamp || new Date()
  }));
});

// Methods
const selectAgent = (agent: Agent) => {
  selectedAgent.value = agent;
};

const refreshData = () => {
  initializeDemoData();
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

// Initialize demo data
const initializeDemoData = () => {
  try {
    console.log('Initializing demo data...');
    
    // Clear existing data
    dashboardStore.clearAllData();
    
    // Generate demo agents
    const demoAgents = demoDataGenerator.generateAgents(8);
    console.log('Generated agents:', demoAgents.length);
    demoAgents.forEach(agent => dashboardStore.updateAgent(agent));
    
    // Generate demo commands
    const demoCommands = demoDataGenerator.generateCommands(demoAgents, 30);
    console.log('Generated commands:', demoCommands.length);
    demoCommands.forEach(command => dashboardStore.updateCommand(command));
    
    // Generate demo connections
    const demoConnections = demoDataGenerator.generateConnections(demoAgents, 12);
    console.log('Generated connections:', demoConnections.length);
    demoConnections.forEach(connection => dashboardStore.updateConnection(connection));
    
    // Generate demo logs
    const demoLogs = demoDataGenerator.generateLogs(demoAgents, 50);
    console.log('Generated logs:', demoLogs.length);
    demoLogs.forEach(log => dashboardStore.addLogEntry(log));
    
    // Generate demo metrics
    const demoMetrics = demoDataGenerator.generateMetrics(demoAgents, 25);
    console.log('Generated metrics:', demoMetrics.length);
    demoMetrics.forEach(metric => dashboardStore.updateMetric(metric));
    
    console.log('Demo data initialization complete!');
  } catch (error) {
    console.error('Error initializing demo data:', error);
    // Don't throw, just log the error so the component can still render
  }
};

onMounted(() => {
  initializeDemoData();
});
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

/* Header Styles */
.dashboard-header {
  background: var(--theme-bg-secondary);
  border-bottom: 1px solid var(--theme-border);
  padding: 1rem 2rem;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.control-button {
  padding: 0.5rem 1rem;
  background: var(--theme-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.control-button:hover {
  background: var(--theme-primary-dark);
  transform: translateY(-1px);
}

/* Dashboard Container */
.dashboard-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* Section Styles */
.dashboard-section {
  background: var(--theme-bg-secondary);
  border-radius: 0.5rem;
  border: 1px solid var(--theme-border);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--theme-bg-tertiary);
  border-bottom: 1px solid var(--theme-border);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.section-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.view-selector {
  padding: 0.375rem 0.75rem;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  cursor: pointer;
}

/* Agents Grid */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.agent-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--theme-bg-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.agent-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.agent-logo {
  position: relative;
  margin-right: 1rem;
}

.logo-icon {
  font-size: 2rem;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.active { background: #10B981; }
.status-indicator.idle { background: #6B7280; }
.status-indicator.error { background: #EF4444; }
.status-indicator.maintenance { background: #F59E0B; }

.agent-info {
  flex: 1;
}

.agent-name {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.agent-type {
  color: var(--theme-text-secondary);
  margin: 0 0 0.5rem 0;
  text-transform: capitalize;
}

.agent-metrics {
  display: flex;
  gap: 1rem;
}

.metric {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

/* Commands List */
.commands-list {
  max-height: 400px;
  overflow-y: auto;
}

.command-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--theme-border);
}

.command-row:last-child {
  border-bottom: none;
}

.command-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.command-type {
  font-weight: 500;
}

.command-agent {
  color: var(--theme-text-secondary);
  font-size: 0.875rem;
}

.command-time {
  color: var(--theme-text-secondary);
  font-size: 0.75rem;
}

.command-status {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.completed { background: #DCFCE7; color: #166534; }
.status-badge.running { background: #DBEAFE; color: #1E40AF; }
.status-badge.failed { background: #FEE2E2; color: #DC2626; }
.status-badge.queued { background: #FEF3C7; color: #92400E; }

.duration {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
}

/* Logs Container */
.logs-container {
  max-height: 400px;
  overflow-y: auto;
  font-family: monospace;
}

.log-entry {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1.5rem;
  border-bottom: 1px solid var(--theme-border);
  font-size: 0.875rem;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: var(--theme-text-secondary);
  min-width: 80px;
}

.log-level {
  min-width: 60px;
  font-weight: 600;
}

.log-level.DEBUG { color: #6B7280; }
.log-level.INFO { color: #3B82F6; }
.log-level.WARN { color: #F59E0B; }
.log-level.ERROR { color: #EF4444; }
.log-level.FATAL { color: #DC2626; }

.log-source {
  min-width: 100px;
  color: var(--theme-text-secondary);
}

.log-message {
  flex: 1;
}

/* Modal Styles */
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

.modal-content {
  background: var(--theme-bg-secondary);
  border-radius: 0.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--theme-border);
}

.modal-header h3 {
  margin: 0;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--theme-text-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.agent-details p {
  margin: 0.5rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .dashboard-container {
    padding: 1rem;
  }

  .agents-grid {
    grid-template-columns: 1fr;
  }

  .command-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .log-entry {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>