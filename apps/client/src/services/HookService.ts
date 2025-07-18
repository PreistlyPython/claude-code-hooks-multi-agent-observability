/**
 * Hook Service for Multi-Agent Observability
 * Implements comprehensive monitoring hooks for agent performance, state changes, and collaboration
 */

import type { Hook, Agent, Command, PerformanceMetric } from '../types/dashboard.types';

export interface HookEvent {
  type: string;
  data: any;
  timestamp: Date;
  agentId?: string;
  commandId?: string;
  metadata?: Record<string, any>;
}

export interface HookSubscription {
  id: string;
  hookType: string;
  callback: (event: HookEvent) => void;
  filters?: Record<string, any>;
}

export interface HookThreshold {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class HookService {
  private hooks: Map<string, Hook> = new Map();
  private subscriptions: Map<string, HookSubscription> = new Map();
  private thresholds: Map<string, HookThreshold> = new Map();
  private metrics: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultThresholds();
  }

  /**
   * Initialize default performance thresholds
   */
  private initializeDefaultThresholds(): void {
    this.addThreshold('cpu-usage-warning', {
      metric: 'cpu_usage',
      operator: '>',
      value: 80,
      severity: 'medium'
    });

    this.addThreshold('cpu-usage-critical', {
      metric: 'cpu_usage',
      operator: '>',
      value: 95,
      severity: 'critical'
    });

    this.addThreshold('memory-usage-warning', {
      metric: 'memory_usage',
      operator: '>',
      value: 85,
      severity: 'medium'
    });

    this.addThreshold('memory-usage-critical', {
      metric: 'memory_usage',
      operator: '>',
      value: 95,
      severity: 'critical'
    });

    this.addThreshold('response-time-warning', {
      metric: 'average_response_time',
      operator: '>',
      value: 1000,
      severity: 'medium'
    });

    this.addThreshold('error-rate-critical', {
      metric: 'error_rate',
      operator: '>',
      value: 5,
      severity: 'critical'
    });
  }

  /**
   * Performance Monitoring Hooks
   */
  
  // Monitor tool execution performance
  public async monitorToolExecution(commandId: string, agentId: string, startTime: Date): Promise<void> {
    const executionTime = Date.now() - startTime.getTime();
    
    const hookData = {
      command_id: commandId,
      agent_id: agentId,
      execution_time: executionTime,
      memory_usage: await this.getMemoryUsage(agentId),
      cpu_usage: await this.getCpuUsage(agentId),
      io_operations: await this.getIoOperations(agentId),
      timestamp: new Date()
    };

    await this.triggerHook('performance-metric-hook', 'tool_execution_complete', agentId, hookData);
    
    // Check thresholds
    await this.checkPerformanceThresholds(agentId, hookData);
  }

  // Monitor resource usage
  public async monitorResourceUsage(agentId: string): Promise<void> {
    const resourceData = {
      agent_id: agentId,
      cpu_usage: await this.getCpuUsage(agentId),
      memory_usage: await this.getMemoryUsage(agentId),
      disk_io: await this.getDiskIo(agentId),
      network_io: await this.getNetworkIo(agentId),
      active_connections: await this.getActiveConnections(agentId),
      timestamp: new Date()
    };

    await this.triggerHook('performance-metric-hook', 'resource_usage_update', agentId, resourceData);
    
    // Check resource thresholds
    await this.checkResourceThresholds(agentId, resourceData);
  }

  /**
   * Agent State Change Hooks
   */
  
  public async monitorAgentStateChange(
    agentId: string, 
    previousState: string, 
    newState: string, 
    reason: string
  ): Promise<void> {
    const stateData = {
      agent_id: agentId,
      previous_state: previousState,
      new_state: newState,
      transition_reason: reason,
      timestamp: new Date(),
      duration_in_previous_state: await this.getStateDuration(agentId, previousState)
    };

    await this.triggerHook('agent-state-change-hook', 'agent_state_transition', agentId, stateData);
    
    // Special handling for error states
    if (newState === 'error') {
      await this.handleAgentError(agentId, reason);
    }
  }

  /**
   * Collaboration Monitoring Hooks
   */
  
  public async monitorAgentCommunication(
    sourceAgentId: string,
    targetAgentId: string,
    messageType: string,
    payloadSize: number
  ): Promise<void> {
    const communicationData = {
      source_agent: sourceAgentId,
      target_agent: targetAgentId,
      message_type: messageType,
      payload_size: payloadSize,
      timestamp: new Date(),
      latency: await this.measureCommunicationLatency(sourceAgentId, targetAgentId)
    };

    await this.triggerHook('agent-collaboration-hook', 'agent_communication', sourceAgentId, communicationData);
    
    // Update collaboration metrics
    await this.updateCollaborationMetrics(sourceAgentId, targetAgentId, messageType);
  }

  /**
   * Error Recovery Hooks
   */
  
  public async monitorErrorRecovery(
    agentId: string,
    errorType: string,
    errorMessage: string,
    stackTrace: string,
    recoveryAction: string
  ): Promise<void> {
    const errorData = {
      agent_id: agentId,
      error_type: errorType,
      error_message: errorMessage,
      stack_trace: stackTrace,
      recovery_action: recoveryAction,
      timestamp: new Date(),
      previous_errors: await this.getRecentErrors(agentId)
    };

    await this.triggerHook('error-recovery-hook', 'error_occurred', agentId, errorData);
    
    // Implement auto-recovery if configured
    await this.attemptAutoRecovery(agentId, errorType, recoveryAction);
  }

  /**
   * Decision Point Hooks
   */
  
  public async monitorDecisionPoint(
    agentId: string,
    decisionType: string,
    optionsConsidered: any[],
    selectedOption: any,
    reasoning: string
  ): Promise<void> {
    const decisionData = {
      agent_id: agentId,
      decision_type: decisionType,
      options_considered: optionsConsidered,
      selected_option: selectedOption,
      reasoning: reasoning,
      timestamp: new Date(),
      decision_time: await this.getDecisionTime(agentId)
    };

    await this.triggerHook('decision-point-hook', 'critical_decision', agentId, decisionData);
    
    // Store decision for learning purposes
    await this.storeDecisionForLearning(agentId, decisionData);
  }

  /**
   * Knowledge Graph Hooks
   */
  
  public async monitorKnowledgeUpdate(
    agentId: string,
    entityType: string,
    operation: 'create' | 'update' | 'delete',
    relationshipsAffected: number
  ): Promise<void> {
    const knowledgeData = {
      agent_id: agentId,
      entity_type: entityType,
      operation: operation,
      relationships_affected: relationshipsAffected,
      timestamp: new Date(),
      knowledge_graph_size: await this.getKnowledgeGraphSize()
    };

    await this.triggerHook('knowledge-update-hook', 'knowledge_graph_modified', agentId, knowledgeData);
    
    // Update knowledge metrics
    await this.updateKnowledgeMetrics(entityType, operation);
  }

  /**
   * Hook Management
   */
  
  private async triggerHook(
    hookType: string,
    trigger: string,
    agentId: string,
    data: any
  ): Promise<void> {
    const hookId = `${hookType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const hook: Hook = {
      id: hookId,
      type: hookType as any,
      trigger: trigger,
      timestamp: new Date(),
      agentId: agentId,
      data: data,
      metadata: {
        processed: false,
        retries: 0,
        priority: this.getHookPriority(hookType, data)
      }
    };

    this.hooks.set(hookId, hook);
    
    // Notify subscribers
    await this.notifySubscribers(hook);
    
    // Store hook for analytics
    await this.storeHook(hook);
  }

  public subscribe(
    hookType: string,
    callback: (event: HookEvent) => void,
    filters?: Record<string, any>
  ): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: HookSubscription = {
      id: subscriptionId,
      hookType: hookType,
      callback: callback,
      filters: filters
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  private async notifySubscribers(hook: Hook): Promise<void> {
    for (const [_, subscription] of this.subscriptions) {
      if (subscription.hookType === hook.type || subscription.hookType === '*') {
        // Apply filters if specified
        if (subscription.filters && !this.matchesFilters(hook, subscription.filters)) {
          continue;
        }

        try {
          const event: HookEvent = {
            type: hook.type,
            data: hook.data,
            timestamp: hook.timestamp,
            agentId: hook.agentId,
            metadata: hook.metadata
          };

          await subscription.callback(event);
        } catch (error) {
          console.error(`Error in hook subscription ${subscription.id}:`, error);
        }
      }
    }
  }

  /**
   * Threshold Management
   */
  
  public addThreshold(id: string, threshold: HookThreshold): void {
    this.thresholds.set(id, threshold);
  }

  public removeThreshold(id: string): void {
    this.thresholds.delete(id);
  }

  private async checkPerformanceThresholds(agentId: string, data: any): Promise<void> {
    for (const [thresholdId, threshold] of this.thresholds) {
      if (this.evaluateThreshold(data, threshold)) {
        await this.triggerThresholdAlert(agentId, thresholdId, threshold, data);
      }
    }
  }

  private async checkResourceThresholds(agentId: string, data: any): Promise<void> {
    for (const [thresholdId, threshold] of this.thresholds) {
      if (this.evaluateThreshold(data, threshold)) {
        await this.triggerHook('resource-threshold-hook', 'resource_usage_exceeded', agentId, {
          threshold_id: thresholdId,
          threshold: threshold,
          current_value: data[threshold.metric],
          severity: threshold.severity,
          data: data
        });
      }
    }
  }

  private evaluateThreshold(data: any, threshold: HookThreshold): boolean {
    const value = data[threshold.metric];
    if (value === undefined) return false;

    switch (threshold.operator) {
      case '>': return value > threshold.value;
      case '<': return value < threshold.value;
      case '=': return value === threshold.value;
      case '>=': return value >= threshold.value;
      case '<=': return value <= threshold.value;
      default: return false;
    }
  }

  /**
   * Utility Methods
   */
  
  private async getMemoryUsage(agentId: string): Promise<number> {
    // Simulate memory usage - in real implementation, this would query actual metrics
    return Math.random() * 100;
  }

  private async getCpuUsage(agentId: string): Promise<number> {
    // Simulate CPU usage - in real implementation, this would query actual metrics
    return Math.random() * 100;
  }

  private async getIoOperations(agentId: string): Promise<number> {
    // Simulate IO operations count
    return Math.floor(Math.random() * 1000);
  }

  private async getDiskIo(agentId: string): Promise<number> {
    return Math.random() * 1000;
  }

  private async getNetworkIo(agentId: string): Promise<number> {
    return Math.random() * 1000;
  }

  private async getActiveConnections(agentId: string): Promise<number> {
    return Math.floor(Math.random() * 50);
  }

  private async getStateDuration(agentId: string, state: string): Promise<number> {
    // Return duration in milliseconds
    return Math.floor(Math.random() * 300000); // 0-5 minutes
  }

  private async measureCommunicationLatency(sourceAgentId: string, targetAgentId: string): Promise<number> {
    // Simulate network latency measurement
    return Math.random() * 100; // 0-100ms
  }

  private async getRecentErrors(agentId: string): Promise<any[]> {
    // Return recent errors for the agent
    return [];
  }

  private async getDecisionTime(agentId: string): Promise<number> {
    // Return time taken to make decision in milliseconds
    return Math.random() * 5000;
  }

  private async getKnowledgeGraphSize(): Promise<number> {
    // Return current knowledge graph size
    return Math.floor(Math.random() * 10000);
  }

  private getHookPriority(hookType: string, data: any): 'low' | 'medium' | 'high' | 'critical' {
    // Determine hook priority based on type and data
    if (hookType.includes('error') || hookType.includes('threshold')) {
      return 'high';
    }
    if (hookType.includes('performance') || hookType.includes('state-change')) {
      return 'medium';
    }
    return 'low';
  }

  private matchesFilters(hook: Hook, filters: Record<string, any>): boolean {
    // Check if hook matches subscription filters
    for (const [key, value] of Object.entries(filters)) {
      if (hook.data[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private async triggerThresholdAlert(
    agentId: string,
    thresholdId: string,
    threshold: HookThreshold,
    data: any
  ): Promise<void> {
    // Trigger alert for threshold violation
    console.warn(`Threshold ${thresholdId} violated for agent ${agentId}:`, {
      threshold,
      currentValue: data[threshold.metric]
    });
  }

  private async handleAgentError(agentId: string, reason: string): Promise<void> {
    // Handle agent error state
    console.error(`Agent ${agentId} entered error state: ${reason}`);
  }

  private async updateCollaborationMetrics(
    sourceAgentId: string,
    targetAgentId: string,
    messageType: string
  ): Promise<void> {
    // Update collaboration metrics
    const key = `${sourceAgentId}->${targetAgentId}`;
    const metrics = this.metrics.get(key) || { messageCount: 0, messageTypes: {} };
    metrics.messageCount++;
    metrics.messageTypes[messageType] = (metrics.messageTypes[messageType] || 0) + 1;
    this.metrics.set(key, metrics);
  }

  private async attemptAutoRecovery(
    agentId: string,
    errorType: string,
    recoveryAction: string
  ): Promise<void> {
    // Implement auto-recovery logic
    console.log(`Attempting auto-recovery for agent ${agentId}: ${recoveryAction}`);
  }

  private async storeDecisionForLearning(agentId: string, decisionData: any): Promise<void> {
    // Store decision data for machine learning
    console.log(`Storing decision data for learning: ${agentId}`, decisionData);
  }

  private async updateKnowledgeMetrics(entityType: string, operation: string): Promise<void> {
    // Update knowledge graph metrics
    const key = `knowledge-${entityType}`;
    const metrics = this.metrics.get(key) || { operations: {} };
    metrics.operations[operation] = (metrics.operations[operation] || 0) + 1;
    this.metrics.set(key, metrics);
  }

  private async storeHook(hook: Hook): Promise<void> {
    // Store hook in persistent storage for analytics
    // In real implementation, this would use a database
    console.log(`Hook stored: ${hook.id}`, hook);
  }

  /**
   * Public API Methods
   */
  
  public getHooks(): Hook[] {
    return Array.from(this.hooks.values());
  }

  public getHookById(id: string): Hook | undefined {
    return this.hooks.get(id);
  }

  public getHooksByType(type: string): Hook[] {
    return Array.from(this.hooks.values()).filter(hook => hook.type === type);
  }

  public getMetrics(): Map<string, any> {
    return this.metrics;
  }

  public clearHooks(): void {
    this.hooks.clear();
  }

  public getSubscriptions(): HookSubscription[] {
    return Array.from(this.subscriptions.values());
  }
}

// Singleton instance
export const hookService = new HookService();