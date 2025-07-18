// Dashboard component types for multi-agent observability

export interface Agent {
  id: string;
  name: string;
  type: 'research' | 'analysis' | 'execution' | 'coordination' | 'monitoring';
  status: 'active' | 'idle' | 'error' | 'maintenance';
  metrics: AgentMetrics;
  uptime: number;
  lastActivity: Date;
  capabilities: string[];
  version: string;
}

export interface AgentMetrics {
  tasksCompleted: number;
  cpuUsage: number;
  memoryUsage: number;
  networkActivity: number;
  diskIO: number;
  activeConnections: number;
  errorCount: number;
  averageResponseTime: number;
}

export interface AgentConnection {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  type: 'data' | 'command' | 'sync' | 'heartbeat';
  status: 'active' | 'inactive' | 'error';
  bandwidth: number;
  latency: number;
  established: Date;
  lastActivity: Date;
  messageCount: number;
}

export interface Command {
  id: string;
  type: string;
  agentId: string;
  timestamp: Date;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  duration?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  parameters?: Record<string, any>;
  output?: string;
  error?: string;
  hooks_triggered?: Hook[];
  retryCount: number;
  maxRetries: number;
}

export interface Hook {
  id: string;
  type: 'performance-metric' | 'agent-state-change' | 'resource-threshold' | 'collaboration' | 'error-recovery' | 'decision-point' | 'knowledge-update';
  trigger: string;
  timestamp: Date;
  agentId: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  agentId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  category: 'system' | 'application' | 'security' | 'performance';
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  agentId?: string;
  category: 'cpu' | 'memory' | 'network' | 'disk' | 'custom';
  status: 'normal' | 'warning' | 'critical';
  threshold?: {
    warning: number;
    critical: number;
  };
  tags?: Record<string, string>;
}

export interface ErrorEntry {
  id: string;
  timestamp: Date;
  type: string;
  message: string;
  stack?: string;
  agentId?: string;
  commandId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolution?: string;
  occurences: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  userId?: string;
  agentId?: string;
  resource: string;
  result: 'success' | 'failure';
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
  category: 'access' | 'modification' | 'deletion' | 'configuration';
  compliance?: {
    regulation: string;
    status: 'compliant' | 'violation' | 'warning';
  };
}

export interface CommandFilters {
  status: string;
  agentId: string;
  timeRange: string;
  searchQuery: string;
}

export interface ExportConfiguration {
  formats: {
    json?: {
      structure: 'flat' | 'nested' | 'normalized';
      includeMetadata: boolean;
      compression: 'none' | 'gzip' | 'brotli';
    };
    csv?: {
      delimiter: ',' | ';' | '\t';
      headers: boolean;
      dateFormat: string;
      encoding: 'utf-8' | 'utf-16';
    };
    parquet?: {
      compression: 'snappy' | 'gzip' | 'lz4';
      rowGroupSize: number;
    };
    excel?: {
      sheets: {
        commands: boolean;
        metrics: boolean;
        logs: boolean;
        summary: boolean;
      };
      styling: boolean;
    };
  };
  filters: {
    timeRange: TimeRange;
    agents: string[];
    commandTypes: string[];
    status: string[];
  };
  aggregations?: {
    groupBy: string[];
    metrics: AggregationMetric[];
  };
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface AggregationMetric {
  field: string;
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  alias?: string;
}

export interface ExportResult {
  id: string;
  format: string;
  size: number;
  recordCount: number;
  downloadUrl: string;
  expiresAt: Date;
}

// Layout and visualization types
export interface DashboardLayout {
  sections: SectionConfig[];
  activeView: ViewMode;
  collapsed: string[];
  order: string[];
}

export interface SectionConfig {
  id: string;
  type: 'logo-visualization' | 'command-center' | 'logs-metrics';
  title: string;
  collapsed: boolean;
  height?: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type ViewMode = 'grid' | 'list' | 'cards' | 'timeline';

export interface AgentPosition {
  agentId: string;
  x: number;
  y: number;
  z?: number;
}

// Animation and interaction types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface InteractionConfig {
  hover: boolean;
  click: boolean;
  drag: boolean;
  zoom: boolean;
}

// Theme and styling types
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  statusColors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

// WebSocket event types
export interface WebSocketEvent {
  type: 'agent-update' | 'command-update' | 'log-entry' | 'metric-update' | 'connection-update' | 'hook-triggered';
  data: any;
  timestamp: Date;
  source: string;
}

// Store state types
export interface DashboardState {
  layout: DashboardLayout;
  agents: Map<string, Agent>;
  commands: Map<string, Command>;
  connections: Map<string, AgentConnection>;
  logs: {
    system: LogEntry[];
    errors: ErrorEntry[];
    audit: AuditEntry[];
  };
  metrics: {
    performance: PerformanceMetric[];
  };
  hooks: Hook[];
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    density: 'compact' | 'comfortable' | 'spacious';
    animations: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}