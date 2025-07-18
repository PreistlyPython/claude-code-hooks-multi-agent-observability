/**
 * Dashboard Store Composable
 * Centralized state management for the dashboard using Vue's reactive system
 */

import { ref, reactive, computed, readonly } from 'vue';
import type { 
  Agent, 
  Command, 
  LogEntry, 
  PerformanceMetric, 
  ErrorEntry, 
  AuditEntry,
  AgentConnection,
  DashboardState,
  ExportConfiguration,
  Hook
} from '../types/dashboard.types';
import { hookService } from '../services/HookService';

// State
const state = reactive<DashboardState>({
  layout: {
    sections: [
      {
        id: 'logo-visualization',
        type: 'logo-visualization',
        title: 'Active Agents',
        collapsed: false,
        position: { x: 0, y: 0, width: 12, height: 4 }
      },
      {
        id: 'command-center',
        type: 'command-center',
        title: 'Command Center',
        collapsed: false,
        position: { x: 0, y: 4, width: 12, height: 6 }
      },
      {
        id: 'logs-metrics',
        type: 'logs-metrics',
        title: 'Logs & Metrics',
        collapsed: false,
        position: { x: 0, y: 10, width: 12, height: 6 }
      }
    ],
    activeView: 'grid',
    collapsed: [],
    order: ['logo-visualization', 'command-center', 'logs-metrics']
  },
  agents: new Map(),
  commands: new Map(),
  connections: new Map(),
  logs: {
    system: [],
    errors: [],
    audit: []
  },
  metrics: {
    performance: []
  },
  hooks: [],
  preferences: {
    theme: 'auto',
    density: 'comfortable',
    animations: true,
    autoRefresh: true,
    refreshInterval: 5000
  }
});

// Loading states
const loading = ref({
  agents: false,
  commands: false,
  logs: false,
  metrics: false,
  export: false
});

// Error states
const errors = ref({
  general: null as string | null,
  export: null as string | null,
  connection: null as string | null
});

export function useDashboardStore() {
  // Computed getters
  const agents = computed(() => Array.from(state.agents.values()));
  const commands = computed(() => Array.from(state.commands.values()));
  const connections = computed(() => Array.from(state.connections.values()));
  const hooks = computed(() => state.hooks);

  const activeAgents = computed(() => 
    agents.value.filter(agent => agent.status === 'active')
  );

  const runningCommands = computed(() =>
    commands.value.filter(cmd => cmd.status === 'running')
  );

  const recentErrors = computed(() =>
    state.logs.errors.slice(-50).reverse()
  );

  const criticalMetrics = computed(() =>
    state.metrics.performance.filter(metric => metric.status === 'critical')
  );

  // Agent management
  const updateAgent = (agentData: Partial<Agent> & { id: string }) => {
    const existingAgent = state.agents.get(agentData.id);
    
    if (existingAgent) {
      // Track state changes for hooks
      if (agentData.status && agentData.status !== existingAgent.status) {
        hookService.monitorAgentStateChange(
          agentData.id,
          existingAgent.status,
          agentData.status,
          'External update'
        );
      }
      
      // Update existing agent
      Object.assign(existingAgent, agentData);
    } else {
      // Create new agent
      const newAgent: Agent = {
        id: agentData.id,
        name: agentData.name || `Agent ${agentData.id}`,
        type: agentData.type || 'execution',
        status: agentData.status || 'idle',
        metrics: agentData.metrics || {
          tasksCompleted: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          networkActivity: 0,
          diskIO: 0,
          activeConnections: 0,
          errorCount: 0,
          averageResponseTime: 0
        },
        uptime: agentData.uptime || 0,
        lastActivity: agentData.lastActivity || new Date(),
        capabilities: agentData.capabilities || [],
        version: agentData.version || '1.0.0'
      };
      
      state.agents.set(agentData.id, newAgent);
    }

    // Monitor resource usage
    if (agentData.metrics) {
      hookService.monitorResourceUsage(agentData.id);
    }
  };

  const removeAgent = (agentId: string) => {
    state.agents.delete(agentId);
    // Also remove related connections
    for (const [connId, connection] of state.connections) {
      if (connection.sourceAgentId === agentId || connection.targetAgentId === agentId) {
        state.connections.delete(connId);
      }
    }
  };

  // Command management
  const updateCommand = (commandData: Partial<Command> & { id: string }) => {
    const existingCommand = state.commands.get(commandData.id);
    
    if (existingCommand) {
      const previousStatus = existingCommand.status;
      Object.assign(existingCommand, commandData);
      
      // Monitor command completion
      if (commandData.status === 'completed' && previousStatus === 'running') {
        const duration = commandData.duration || 
          (Date.now() - new Date(existingCommand.timestamp).getTime());
        
        hookService.monitorToolExecution(
          commandData.id,
          existingCommand.agentId,
          existingCommand.timestamp
        );
      }
    } else {
      // Create new command
      const newCommand: Command = {
        id: commandData.id,
        type: commandData.type || 'unknown',
        agentId: commandData.agentId || 'unknown',
        timestamp: commandData.timestamp || new Date(),
        status: commandData.status || 'queued',
        priority: commandData.priority || 'medium',
        retryCount: commandData.retryCount || 0,
        maxRetries: commandData.maxRetries || 3,
        ...commandData
      };
      
      state.commands.set(commandData.id, newCommand);
    }
  };

  const retryCommand = async (commandId: string) => {
    const command = state.commands.get(commandId);
    if (command && command.retryCount < command.maxRetries) {
      command.retryCount++;
      command.status = 'queued';
      command.error = undefined;
      
      // Trigger retry hook
      await hookService.monitorErrorRecovery(
        command.agentId,
        'command_retry',
        `Retrying command ${commandId}`,
        '',
        'manual_retry'
      );
    }
  };

  const cancelCommand = async (commandId: string) => {
    const command = state.commands.get(commandId);
    if (command && (command.status === 'queued' || command.status === 'running')) {
      command.status = 'cancelled';
    }
  };

  // Connection management
  const updateConnection = (connectionData: Partial<AgentConnection> & { id: string }) => {
    const existingConnection = state.connections.get(connectionData.id);
    
    if (existingConnection) {
      Object.assign(existingConnection, connectionData);
    } else {
      const newConnection: AgentConnection = {
        id: connectionData.id,
        sourceAgentId: connectionData.sourceAgentId || 'unknown',
        targetAgentId: connectionData.targetAgentId || 'unknown',
        type: connectionData.type || 'data',
        status: connectionData.status || 'inactive',
        bandwidth: connectionData.bandwidth || 0,
        latency: connectionData.latency || 0,
        established: connectionData.established || new Date(),
        lastActivity: connectionData.lastActivity || new Date(),
        messageCount: connectionData.messageCount || 0
      };
      
      state.connections.set(connectionData.id, newConnection);
    }

    // Monitor agent communication
    if (connectionData.sourceAgentId && connectionData.targetAgentId) {
      hookService.monitorAgentCommunication(
        connectionData.sourceAgentId,
        connectionData.targetAgentId,
        connectionData.type || 'data',
        connectionData.bandwidth || 0
      );
    }
  };

  // Log management
  const addLogEntry = (logData: Partial<LogEntry> & { message: string }) => {
    const logEntry: LogEntry = {
      id: logData.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: logData.timestamp || new Date(),
      level: logData.level || 'info',
      message: logData.message,
      source: logData.source || 'system',
      category: logData.category || 'system',
      ...logData
    };

    // Add to appropriate log category
    switch (logEntry.category) {
      case 'system':
        state.logs.system.push(logEntry);
        // Keep only last 1000 entries
        if (state.logs.system.length > 1000) {
          state.logs.system = state.logs.system.slice(-1000);
        }
        break;
    }

    // If it's an error, also add to error logs
    if (logEntry.level === 'error') {
      const errorEntry: ErrorEntry = {
        id: logEntry.id,
        timestamp: logEntry.timestamp,
        type: 'application_error',
        message: logEntry.message,
        stack: logData.stackTrace,
        agentId: logEntry.agentId,
        severity: 'medium',
        resolved: false,
        occurences: 1,
        firstOccurrence: logEntry.timestamp,
        lastOccurrence: logEntry.timestamp
      };
      
      state.logs.errors.push(errorEntry);
      
      // Trigger error hook
      if (logEntry.agentId) {
        hookService.monitorErrorRecovery(
          logEntry.agentId,
          'application_error',
          logEntry.message,
          logData.stackTrace || '',
          'logged'
        );
      }
    }
  };

  const addAuditEntry = (auditData: Partial<AuditEntry> & { action: string; resource: string }) => {
    const auditEntry: AuditEntry = {
      id: auditData.id || `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: auditData.timestamp || new Date(),
      action: auditData.action,
      resource: auditData.resource,
      result: auditData.result || 'success',
      details: auditData.details || {},
      severity: auditData.severity || 'low',
      category: auditData.category || 'access',
      ...auditData
    };

    state.logs.audit.push(auditEntry);
    
    // Keep only last 1000 entries
    if (state.logs.audit.length > 1000) {
      state.logs.audit = state.logs.audit.slice(-1000);
    }
  };

  // Metrics management
  const updateMetric = (metricData: Partial<PerformanceMetric> & { name: string; value: number }) => {
    const metric: PerformanceMetric = {
      id: metricData.id || `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: metricData.name,
      value: metricData.value,
      unit: metricData.unit || '',
      timestamp: metricData.timestamp || new Date(),
      category: metricData.category || 'custom',
      status: metricData.status || 'normal',
      ...metricData
    };

    state.metrics.performance.push(metric);
    
    // Keep only last 10000 entries (for performance)
    if (state.metrics.performance.length > 10000) {
      state.metrics.performance = state.metrics.performance.slice(-10000);
    }

    // Check metric thresholds
    if (metric.threshold && metricData.agentId) {
      const { warning, critical } = metric.threshold;
      if (metric.value >= critical) {
        metric.status = 'critical';
      } else if (metric.value >= warning) {
        metric.status = 'warning';
      }
    }
  };

  // Hook management
  const addHook = (hook: Hook) => {
    state.hooks.push(hook);
    
    // Keep only last 5000 hooks
    if (state.hooks.length > 5000) {
      state.hooks = state.hooks.slice(-5000);
    }
  };

  // Layout management
  const toggleSection = (sectionId: string) => {
    const index = state.layout.collapsed.indexOf(sectionId);
    if (index > -1) {
      state.layout.collapsed.splice(index, 1);
    } else {
      state.layout.collapsed.push(sectionId);
    }
  };

  const reorderSections = (newOrder: string[]) => {
    state.layout.order = newOrder;
  };

  const updateLayoutMode = (mode: 'grid' | 'list' | 'cards' | 'timeline') => {
    state.layout.activeView = mode;
  };

  // Category management
  const toggleLogCategory = (category: string) => {
    console.log(`Toggling log category: ${category}`);
    // Implement category toggle logic
  };

  // Export functionality
  const exportData = async (config: ExportConfiguration) => {
    loading.value.export = true;
    errors.value.export = null;

    try {
      // Collect data based on configuration
      const data: any = {};

      // Add selected data sources
      Object.keys(config.formats).forEach(format => {
        if (config.filters.agents.length > 0) {
          data.agents = agents.value.filter(agent => 
            config.filters.agents.includes(agent.id)
          );
        } else {
          data.agents = agents.value;
        }

        data.commands = commands.value.filter(cmd => {
          const timeFilter = cmd.timestamp >= config.filters.timeRange.start &&
                           cmd.timestamp <= config.filters.timeRange.end;
          const statusFilter = config.filters.status.length === 0 ||
                             config.filters.status.includes(cmd.status);
          return timeFilter && statusFilter;
        });

        data.logs = state.logs.system.filter(log =>
          log.timestamp >= config.filters.timeRange.start &&
          log.timestamp <= config.filters.timeRange.end
        );

        data.metrics = state.metrics.performance.filter(metric =>
          metric.timestamp >= config.filters.timeRange.start &&
          metric.timestamp <= config.filters.timeRange.end
        );
      });

      // Simulate export processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, this would generate and download files
      console.log('Export completed:', { config, data });

      return {
        id: `export-${Date.now()}`,
        format: Object.keys(config.formats)[0],
        size: JSON.stringify(data).length,
        recordCount: Object.values(data).flat().length,
        downloadUrl: '#',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

    } catch (error) {
      errors.value.export = error instanceof Error ? error.message : 'Export failed';
      throw error;
    } finally {
      loading.value.export = false;
    }
  };

  // Preferences management
  const updatePreferences = (newPreferences: Partial<typeof state.preferences>) => {
    Object.assign(state.preferences, newPreferences);
  };

  // Initialize hook service subscriptions
  const initializeHookSubscriptions = () => {
    // Subscribe to all hook types
    hookService.subscribe('*', (event) => {
      const hook: Hook = {
        id: `hook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: event.type as any,
        trigger: 'subscription',
        timestamp: event.timestamp,
        agentId: event.agentId || 'system',
        data: event.data,
        metadata: event.metadata
      };
      
      addHook(hook);
    });
  };

  // Clear all data
  const clearAllData = () => {
    state.agents.clear();
    state.commands.clear();
    state.connections.clear();
    state.logs.system = [];
    state.logs.errors = [];
    state.logs.audit = [];
    state.metrics.performance = [];
    state.hooks = [];
  };

  return {
    // State
    state: readonly(state),
    loading: readonly(loading),
    errors: readonly(errors),

    // Computed
    agents,
    commands,
    connections,
    hooks,
    activeAgents,
    runningCommands,
    recentErrors,
    criticalMetrics,

    // Agent methods
    updateAgent,
    removeAgent,

    // Command methods
    updateCommand,
    retryCommand,
    cancelCommand,

    // Connection methods
    updateConnection,

    // Log methods
    addLogEntry,
    addAuditEntry,

    // Metrics methods
    updateMetric,

    // Hook methods
    addHook,

    // Layout methods
    toggleSection,
    reorderSections,
    updateLayoutMode,
    toggleLogCategory,

    // Export methods
    exportData,

    // Preferences methods
    updatePreferences,

    // Utility methods
    initializeHookSubscriptions,
    clearAllData
  };
}

// Global singleton store instance
let storeInstance: ReturnType<typeof useDashboardStore> | null = null;

export function getDashboardStore() {
  if (!storeInstance) {
    storeInstance = useDashboardStore();
    storeInstance.initializeHookSubscriptions();
  }
  return storeInstance;
}