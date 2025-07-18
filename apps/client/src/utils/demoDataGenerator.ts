/**
 * Demo Data Generator for Dashboard Testing
 * Generates realistic sample data for the enhanced dashboard
 */

import type { 
  Agent, 
  Command, 
  LogEntry, 
  PerformanceMetric, 
  ErrorEntry, 
  AuditEntry,
  AgentConnection 
} from '../types/dashboard.types';

export class DemoDataGenerator {
  private agentTypes: Agent['type'][] = ['research', 'analysis', 'execution', 'coordination', 'monitoring'];
  private commandTypes = [
    'file-read', 'file-write', 'api-call', 'data-process', 'analysis-run',
    'model-train', 'query-execute', 'task-schedule', 'notification-send'
  ];
  private logLevels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error', 'fatal'];
  private errorTypes = ['ValidationError', 'NetworkError', 'TimeoutError', 'AuthError', 'SystemError'];

  /**
   * Generate sample agents
   */
  generateAgents(count: number = 8): Agent[] {
    const agents: Agent[] = [];
    
    for (let i = 0; i < count; i++) {
      const agentId = `agent-${i + 1}`;
      const type = this.agentTypes[i % this.agentTypes.length];
      const status = this.randomChoice(['active', 'idle', 'error', 'maintenance'], [0.6, 0.25, 0.1, 0.05]);
      
      agents.push({
        id: agentId,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Agent ${i + 1}`,
        type,
        status,
        metrics: {
          tasksCompleted: Math.floor(Math.random() * 1000) + 50,
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          networkActivity: Math.random() * 1000,
          diskIO: Math.random() * 500,
          activeConnections: Math.floor(Math.random() * 20),
          errorCount: Math.floor(Math.random() * 10),
          averageResponseTime: Math.random() * 2000 + 100
        },
        uptime: Math.random() * 86400 * 7, // Up to 7 days
        lastActivity: this.randomDate(24), // Within last 24 hours
        capabilities: this.generateCapabilities(type),
        version: `1.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`
      });
    }
    
    return agents;
  }

  /**
   * Generate sample commands
   */
  generateCommands(agents: Agent[], count: number = 50): Command[] {
    const commands: Command[] = [];
    
    for (let i = 0; i < count; i++) {
      const agent = this.randomChoice(agents);
      const status = this.randomChoice(['queued', 'running', 'completed', 'failed', 'cancelled'], [0.1, 0.2, 0.5, 0.15, 0.05]);
      const timestamp = this.randomDate(7 * 24); // Within last 7 days
      
      commands.push({
        id: `cmd-${i + 1}`,
        type: this.randomChoice(this.commandTypes),
        agentId: agent.id,
        timestamp,
        status,
        duration: status === 'completed' ? Math.random() * 10000 + 100 : 
                 status === 'failed' ? Math.random() * 5000 + 50 : undefined,
        priority: this.randomChoice(['low', 'medium', 'high', 'critical'], [0.3, 0.4, 0.25, 0.05]),
        parameters: this.generateCommandParameters(),
        output: status === 'completed' ? this.generateCommandOutput() : undefined,
        error: status === 'failed' ? this.generateError() : undefined,
        retryCount: status === 'failed' ? Math.floor(Math.random() * 3) : 0,
        maxRetries: 3
      });
    }
    
    return commands.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate agent connections
   */
  generateConnections(agents: Agent[], count: number = 15): AgentConnection[] {
    const connections: AgentConnection[] = [];
    
    for (let i = 0; i < count; i++) {
      const sourceAgent = this.randomChoice(agents);
      const targetAgent = this.randomChoice(agents.filter(a => a.id !== sourceAgent.id));
      
      connections.push({
        id: `conn-${i + 1}`,
        sourceAgentId: sourceAgent.id,
        targetAgentId: targetAgent.id,
        type: this.randomChoice(['data', 'command', 'sync', 'heartbeat'], [0.4, 0.3, 0.2, 0.1]),
        status: this.randomChoice(['active', 'inactive', 'error'], [0.7, 0.25, 0.05]),
        bandwidth: Math.random() * 1000, // MB/s
        latency: Math.random() * 100, // ms
        established: this.randomDate(7 * 24),
        lastActivity: this.randomDate(1),
        messageCount: Math.floor(Math.random() * 10000) + 100
      });
    }
    
    return connections;
  }

  /**
   * Generate system logs
   */
  generateLogs(agents: Agent[], count: number = 200): LogEntry[] {
    const logs: LogEntry[] = [];
    
    for (let i = 0; i < count; i++) {
      const level = this.randomChoice(this.logLevels, [0.3, 0.4, 0.2, 0.08, 0.02]);
      const agent = Math.random() > 0.3 ? this.randomChoice(agents) : null;
      
      logs.push({
        id: `log-${i + 1}`,
        timestamp: this.randomDate(24),
        level,
        message: this.generateLogMessage(level),
        source: agent ? agent.id : 'system',
        agentId: agent?.id,
        category: this.randomChoice(['system', 'application', 'security', 'performance'], [0.4, 0.3, 0.2, 0.1]),
        metadata: {
          module: this.randomChoice(['core', 'network', 'storage', 'auth', 'scheduler']),
          thread: `thread-${Math.floor(Math.random() * 10) + 1}`
        }
      });
    }
    
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate performance metrics
   */
  generateMetrics(agents: Agent[], count: number = 100): PerformanceMetric[] {
    const metrics: PerformanceMetric[] = [];
    const metricNames = ['cpu_usage', 'memory_usage', 'network_io', 'disk_io', 'response_time', 'throughput'];
    
    for (let i = 0; i < count; i++) {
      const metricName = this.randomChoice(metricNames);
      const agent = Math.random() > 0.2 ? this.randomChoice(agents) : null;
      const value = this.generateMetricValue(metricName);
      
      metrics.push({
        id: `metric-${i + 1}`,
        name: metricName,
        value,
        unit: this.getMetricUnit(metricName),
        timestamp: this.randomDate(24),
        agentId: agent?.id,
        category: this.getMetricCategory(metricName),
        status: this.getMetricStatus(metricName, value),
        threshold: this.getMetricThreshold(metricName),
        tags: {
          environment: 'production',
          region: this.randomChoice(['us-east-1', 'us-west-2', 'eu-west-1'])
        }
      });
    }
    
    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate error entries
   */
  generateErrors(agents: Agent[], count: number = 20): ErrorEntry[] {
    const errors: ErrorEntry[] = [];
    
    for (let i = 0; i < count; i++) {
      const agent = this.randomChoice(agents);
      const errorType = this.randomChoice(this.errorTypes);
      const timestamp = this.randomDate(7 * 24);
      
      errors.push({
        id: `error-${i + 1}`,
        timestamp,
        type: errorType,
        message: this.generateErrorMessage(errorType),
        stack: this.generateStackTrace(),
        agentId: agent.id,
        severity: this.randomChoice(['low', 'medium', 'high', 'critical'], [0.2, 0.4, 0.3, 0.1]),
        resolved: Math.random() > 0.3,
        resolution: Math.random() > 0.5 ? this.generateResolution() : undefined,
        occurences: Math.floor(Math.random() * 10) + 1,
        firstOccurrence: timestamp,
        lastOccurrence: this.randomDate(1)
      });
    }
    
    return errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate audit entries
   */
  generateAuditEntries(agents: Agent[], count: number = 30): AuditEntry[] {
    const entries: AuditEntry[] = [];
    const actions = ['create', 'update', 'delete', 'access', 'configure', 'deploy'];
    const resources = ['agent', 'command', 'config', 'data', 'model', 'service'];
    
    for (let i = 0; i < count; i++) {
      const agent = this.randomChoice(agents);
      const action = this.randomChoice(actions);
      const resource = this.randomChoice(resources);
      
      entries.push({
        id: `audit-${i + 1}`,
        timestamp: this.randomDate(30 * 24),
        action: `${action}_${resource}`,
        userId: `user-${Math.floor(Math.random() * 5) + 1}`,
        agentId: agent.id,
        resource: `${resource}-${Math.floor(Math.random() * 100) + 1}`,
        result: this.randomChoice(['success', 'failure'], [0.85, 0.15]),
        details: {
          ip: this.generateIP(),
          userAgent: 'AgentDashboard/1.0',
          changes: this.generateAuditChanges()
        },
        severity: this.randomChoice(['low', 'medium', 'high'], [0.6, 0.3, 0.1]),
        category: this.randomChoice(['access', 'modification', 'deletion', 'configuration'], [0.4, 0.3, 0.2, 0.1])
      });
    }
    
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Helper methods
  private randomChoice<T>(array: T[], weights?: number[]): T {
    if (!weights) {
      return array[Math.floor(Math.random() * array.length)];
    }
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < array.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return array[i];
      }
    }
    
    return array[array.length - 1];
  }

  private randomDate(hoursBack: number): Date {
    const now = new Date();
    const msBack = hoursBack * 60 * 60 * 1000;
    return new Date(now.getTime() - Math.random() * msBack);
  }

  private generateCapabilities(type: Agent['type']): string[] {
    const baseCapabilities = ['monitoring', 'logging', 'error-handling'];
    const typeSpecific = {
      research: ['web-search', 'data-collection', 'content-analysis'],
      analysis: ['data-processing', 'pattern-recognition', 'reporting'],
      execution: ['task-execution', 'file-operations', 'api-integration'],
      coordination: ['workflow-management', 'agent-communication', 'load-balancing'],
      monitoring: ['system-monitoring', 'alert-management', 'health-checks']
    };
    
    return [...baseCapabilities, ...typeSpecific[type]];
  }

  private generateCommandParameters(): Record<string, any> {
    return {
      timeout: Math.floor(Math.random() * 30000) + 5000,
      retries: Math.floor(Math.random() * 3) + 1,
      priority: this.randomChoice(['low', 'medium', 'high']),
      async: Math.random() > 0.5
    };
  }

  private generateCommandOutput(): string {
    const outputs = [
      'Task completed successfully',
      'Data processed: 1,234 records',
      'File written: /tmp/output.json',
      'API response: 200 OK',
      'Analysis complete: 95% confidence'
    ];
    return this.randomChoice(outputs);
  }

  private generateError(): string {
    const errors = [
      'Connection timeout after 30s',
      'Invalid response format from API',
      'File not found: /path/to/file.txt',
      'Insufficient permissions for operation',
      'Memory allocation failed'
    ];
    return this.randomChoice(errors);
  }

  private generateLogMessage(level: LogEntry['level']): string {
    const messages = {
      debug: ['Debug trace for request ID 12345', 'Variable state: initialized'],
      info: ['Service started successfully', 'User authenticated', 'Task scheduled'],
      warn: ['High memory usage detected', 'Slow query detected', 'Rate limit approaching'],
      error: ['Failed to connect to database', 'Invalid configuration', 'Request timeout'],
      fatal: ['System out of memory', 'Critical service failure', 'Security breach detected']
    };
    return this.randomChoice(messages[level]);
  }

  private generateMetricValue(metricName: string): number {
    const ranges = {
      cpu_usage: [0, 100],
      memory_usage: [0, 100],
      network_io: [0, 1000],
      disk_io: [0, 500],
      response_time: [10, 2000],
      throughput: [1, 1000]
    };
    
    const [min, max] = ranges[metricName as keyof typeof ranges] || [0, 100];
    return Math.random() * (max - min) + min;
  }

  private getMetricUnit(metricName: string): string {
    const units = {
      cpu_usage: '%',
      memory_usage: '%',
      network_io: 'MB/s',
      disk_io: 'MB/s',
      response_time: 'ms',
      throughput: 'req/s'
    };
    return units[metricName as keyof typeof units] || '';
  }

  private getMetricCategory(metricName: string): PerformanceMetric['category'] {
    if (metricName.includes('cpu')) return 'cpu';
    if (metricName.includes('memory')) return 'memory';
    if (metricName.includes('network')) return 'network';
    if (metricName.includes('disk')) return 'disk';
    return 'custom';
  }

  private getMetricStatus(metricName: string, value: number): PerformanceMetric['status'] {
    const thresholds = {
      cpu_usage: { warning: 70, critical: 90 },
      memory_usage: { warning: 80, critical: 95 },
      response_time: { warning: 1000, critical: 2000 }
    };
    
    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (!threshold) return 'normal';
    
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  }

  private getMetricThreshold(metricName: string): { warning: number; critical: number } | undefined {
    const thresholds = {
      cpu_usage: { warning: 70, critical: 90 },
      memory_usage: { warning: 80, critical: 95 },
      response_time: { warning: 1000, critical: 2000 }
    };
    return thresholds[metricName as keyof typeof thresholds];
  }

  private generateErrorMessage(errorType: string): string {
    const messages = {
      ValidationError: 'Input validation failed for field "email"',
      NetworkError: 'Network unreachable, connection timed out',
      TimeoutError: 'Operation timed out after 30 seconds',
      AuthError: 'Authentication failed - invalid credentials',
      SystemError: 'Internal system error occurred'
    };
    return messages[errorType as keyof typeof messages] || 'Unknown error occurred';
  }

  private generateStackTrace(): string {
    return `Error: Sample error
    at Function.execute (/app/src/agent.js:145:12)
    at Agent.run (/app/src/core.js:89:7)
    at Scheduler.processQueue (/app/src/scheduler.js:234:15)
    at /app/src/main.js:67:23`;
  }

  private generateResolution(): string {
    const resolutions = [
      'Restarted service and cleared cache',
      'Updated configuration and redeployed',
      'Applied hotfix and monitored for 24h',
      'Scaled resources and optimized queries'
    ];
    return this.randomChoice(resolutions);
  }

  private generateIP(): string {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  private generateAuditChanges(): Record<string, any> {
    return {
      field: this.randomChoice(['name', 'status', 'config', 'permissions']),
      oldValue: 'old_value',
      newValue: 'new_value'
    };
  }
}

// Export singleton instance
export const demoDataGenerator = new DemoDataGenerator();