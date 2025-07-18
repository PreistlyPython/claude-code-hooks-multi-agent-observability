<template>
  <div class="dashboard-layout">
    <!-- Header Section -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">Multi-Agent Observability Dashboard</h1>
        <div class="header-controls">
          <button @click="toggleExportDialog" class="export-button">
            Export Data
          </button>
          <button @click="toggleLayoutMode" class="layout-button">
            {{ layoutMode === 'grid' ? 'List View' : 'Grid View' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Main Dashboard Container -->
    <div class="dashboard-container" :class="`layout-${layoutMode}`">
      <!-- Logo Visualization Section -->
      <section class="dashboard-section logo-section">
        <div class="section-header">
          <h2 class="section-title">Active Agents</h2>
          <div class="section-controls">
            <button @click="toggleAutoArrange" class="control-button">
              {{ autoArrange ? 'Manual' : 'Auto' }} Arrange
            </button>
          </div>
        </div>
        <LogoVisualizationSection
          :agents="agents"
          :connections="agentConnections"
          :layout-mode="layoutMode"
          :auto-arrange="autoArrange"
          @agent-click="handleAgentClick"
          @connection-click="handleConnectionClick"
        />
      </section>

      <!-- Command Center Section -->
      <section class="dashboard-section command-section">
        <div class="section-header">
          <h2 class="section-title">Command Center</h2>
          <div class="section-controls">
            <select v-model="commandView" class="view-selector">
              <option value="table">Table View</option>
              <option value="cards">Card View</option>
              <option value="timeline">Timeline View</option>
            </select>
          </div>
        </div>
        <CommandCenterSection
          :commands="commands"
          :view-mode="commandView"
          :filters="commandFilters"
          @filter-change="updateCommandFilters"
          @command-action="handleCommandAction"
        />
      </section>

      <!-- Logs & Metrics Section -->
      <section class="dashboard-section logs-section">
        <div class="section-header">
          <h2 class="section-title">Logs & Metrics</h2>
          <div class="section-controls">
            <button @click="toggleLogsExpanded" class="control-button">
              {{ logsExpanded ? 'Collapse' : 'Expand' }} All
            </button>
          </div>
        </div>
        <LogsMetricsSection
          :logs="systemLogs"
          :metrics="performanceMetrics"
          :errors="errorLogs"
          :audit="auditTrail"
          :expanded="logsExpanded"
          @category-toggle="handleCategoryToggle"
        />
      </section>
    </div>

    <!-- Export Dialog -->
    <ExportDialog
      v-if="showExportDialog"
      :data-sources="availableDataSources"
      @export="handleExport"
      @close="showExportDialog = false"
    />

    <!-- Agent Details Modal -->
    <AgentDetailsModal
      v-if="selectedAgent"
      :agent="selectedAgent"
      @close="selectedAgent = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import LogoVisualizationSection from './sections/LogoVisualization/LogoVisualizationSection.vue';
import CommandCenterSection from './sections/CommandCenter/CommandCenterSection.vue';
import LogsMetricsSection from './sections/LogsMetrics/LogsMetricsSection.vue';
import ExportDialog from './export/ExportDialog.vue';
import AgentDetailsModal from './AgentDetailsModal.vue';
import { getDashboardStore } from '../../composables/useDashboardStore';
import { useWebSocket } from '../../composables/useWebSocket';
import type { Agent, Command, LogEntry, PerformanceMetric, AgentConnection } from '../../types/dashboard.types';

// Store and composables
const dashboardStore = getDashboardStore();
const { subscribe, unsubscribe } = useWebSocket();

// Import demo data generator for testing
import { demoDataGenerator } from '../../utils/demoDataGenerator';

// Layout state
const layoutMode = ref<'grid' | 'list'>('grid');
const autoArrange = ref(true);
const logsExpanded = ref(false);
const commandView = ref<'table' | 'cards' | 'timeline'>('table');

// Dialog state
const showExportDialog = ref(false);
const selectedAgent = ref<Agent | null>(null);

// Filters
const commandFilters = ref({
  status: 'all',
  agentId: '',
  timeRange: 'last-hour',
  searchQuery: ''
});

// Data from store
const agents = computed(() => dashboardStore.agents);
const agentConnections = computed(() => dashboardStore.connections);
const commands = computed(() => dashboardStore.commands);
const systemLogs = computed(() => dashboardStore.state.logs.system);
const performanceMetrics = computed(() => dashboardStore.state.metrics.performance);
const errorLogs = computed(() => dashboardStore.state.logs.errors);
const auditTrail = computed(() => dashboardStore.state.logs.audit);

// Available data sources for export
const availableDataSources = computed(() => [
  { id: 'agents', name: 'Agent Data', count: agents.value.length },
  { id: 'commands', name: 'Commands', count: commands.value.length },
  { id: 'logs', name: 'System Logs', count: systemLogs.value.length },
  { id: 'metrics', name: 'Performance Metrics', count: performanceMetrics.value.length }
]);

// Methods
const toggleLayoutMode = () => {
  layoutMode.value = layoutMode.value === 'grid' ? 'list' : 'grid';
};

const toggleAutoArrange = () => {
  autoArrange.value = !autoArrange.value;
};

const toggleLogsExpanded = () => {
  logsExpanded.value = !logsExpanded.value;
};

const toggleExportDialog = () => {
  showExportDialog.value = !showExportDialog.value;
};

const handleAgentClick = (agent: Agent) => {
  selectedAgent.value = agent;
};

const handleConnectionClick = (connection: AgentConnection) => {
  console.log('Connection clicked:', connection);
  // Handle connection click - maybe highlight the connected agents
};

const updateCommandFilters = (newFilters: typeof commandFilters.value) => {
  commandFilters.value = newFilters;
};

const handleCommandAction = (action: { command: Command; type: string }) => {
  switch (action.type) {
    case 'retry':
      dashboardStore.retryCommand(action.command.id);
      break;
    case 'cancel':
      dashboardStore.cancelCommand(action.command.id);
      break;
    case 'details':
      // Handle showing command details
      break;
  }
};

const handleCategoryToggle = (category: string) => {
  dashboardStore.toggleLogCategory(category);
};

const handleExport = async (config: any) => {
  try {
    await dashboardStore.exportData(config);
    showExportDialog.value = false;
  } catch (error) {
    console.error('Export failed:', error);
  }
};

// WebSocket subscriptions and demo data initialization
onMounted(() => {
  // Initialize with demo data for testing
  initializeDemoData();
  
  // Subscribe to different event types
  subscribe('agent-update', (data) => {
    dashboardStore.updateAgent(data);
  });

  subscribe('command-update', (data) => {
    dashboardStore.updateCommand(data);
  });

  subscribe('log-entry', (data) => {
    dashboardStore.addLogEntry(data);
  });

  subscribe('metric-update', (data) => {
    dashboardStore.updateMetric(data);
  });

  subscribe('connection-update', (data) => {
    dashboardStore.updateConnection(data);
  });
});

// Initialize demo data
const initializeDemoData = () => {
  // Generate demo agents
  const demoAgents = demoDataGenerator.generateAgents(8);
  demoAgents.forEach(agent => dashboardStore.updateAgent(agent));
  
  // Generate demo commands
  const demoCommands = demoDataGenerator.generateCommands(demoAgents, 30);
  demoCommands.forEach(command => dashboardStore.updateCommand(command));
  
  // Generate demo connections
  const demoConnections = demoDataGenerator.generateConnections(demoAgents, 12);
  demoConnections.forEach(connection => dashboardStore.updateConnection(connection));
  
  // Generate demo logs
  const demoLogs = demoDataGenerator.generateLogs(demoAgents, 100);
  demoLogs.forEach(log => dashboardStore.addLogEntry(log));
  
  // Generate demo metrics
  const demoMetrics = demoDataGenerator.generateMetrics(demoAgents, 50);
  demoMetrics.forEach(metric => dashboardStore.updateMetric(metric));
  
  // Generate demo errors
  const demoErrors = demoDataGenerator.generateErrors(demoAgents, 15);
  demoErrors.forEach(error => {
    dashboardStore.addLogEntry({
      id: error.id,
      timestamp: error.timestamp,
      level: 'error',
      message: error.message,
      source: error.agentId || 'system',
      agentId: error.agentId,
      category: 'application',
      stackTrace: error.stack
    });
  });
  
  // Generate demo audit entries
  const demoAudit = demoDataGenerator.generateAuditEntries(demoAgents, 20);
  demoAudit.forEach(audit => dashboardStore.addAuditEntry(audit));
};

onUnmounted(() => {
  // Clean up subscriptions
  unsubscribe('agent-update');
  unsubscribe('command-update');
  unsubscribe('log-entry');
  unsubscribe('metric-update');
  unsubscribe('connection-update');
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

.header-controls {
  display: flex;
  gap: 1rem;
}

.export-button,
.layout-button,
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

.export-button:hover,
.layout-button:hover,
.control-button:hover {
  background: var(--theme-primary-dark);
  transform: translateY(-1px);
}

/* Dashboard Container */
.dashboard-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.dashboard-container.layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.dashboard-container.layout-list {
  display: flex;
  flex-direction: column;
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

  .section-header {
    padding: 0.75rem 1rem;
  }

  .section-controls {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .dashboard-layout {
    background-color: #0f172a;
    color: #e2e8f0;
  }

  .dashboard-section {
    background-color: #1e293b;
    border-color: #334155;
  }

  .section-header {
    background-color: #0f172a;
    border-color: #334155;
  }
}
</style>