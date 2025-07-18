# Enhanced Monitoring Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing comprehensive monitoring based on the Claude Code Agent Lifecycle Analysis. It extends the current basic event tracking to capture all identified metrics.

## Current State Analysis

### What We Have Now
- Basic event tracking (PreToolUse, PostToolUse, Notification, Stop, SubagentStop)
- Session and source app identification
- Simple payload storage
- Real-time WebSocket streaming
- Basic filtering capabilities

### What's Missing
- Detailed performance metrics
- Cost tracking
- Error analysis
- File system impact tracking
- Git operation monitoring
- Memory and context metrics
- Agent collaboration patterns
- Advanced analytics

## Implementation Phases

### Phase 1: Enhanced Data Model (Week 1)

#### 1.1 Extended Event Schema
```typescript
// Update apps/server/src/types.ts
export interface EnhancedHookEvent extends HookEvent {
  // Performance metrics
  metrics?: {
    executionTime?: number;
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
      cost: number;
    };
    memoryUsage?: {
      contextSize: number;
      contextUtilization: number;
      compressionEvents: number;
    };
  };
  
  // Error tracking
  error?: {
    type: string;
    message: string;
    stackTrace?: string;
    recoverable: boolean;
    retryCount: number;
  };
  
  // File system tracking
  fileOperations?: {
    type: 'read' | 'write' | 'edit' | 'delete';
    path: string;
    size?: number;
    duration?: number;
  }[];
  
  // Git tracking
  gitOperations?: {
    command: string;
    branch?: string;
    filesChanged?: number;
    insertions?: number;
    deletions?: number;
  };
  
  // Tool chain tracking
  toolChain?: {
    previousTool?: string;
    nextTool?: string;
    isParallel: boolean;
  };
}
```

#### 1.2 Database Schema Updates
```sql
-- New tables for detailed metrics
CREATE TABLE IF NOT EXISTS event_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  execution_time INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  cost REAL,
  context_size INTEGER,
  context_utilization REAL,
  compression_events INTEGER,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS event_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  recoverable INTEGER,
  retry_count INTEGER,
  resolved INTEGER DEFAULT 0,
  resolution_time INTEGER,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS file_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  operation_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  duration INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS git_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  command TEXT NOT NULL,
  branch TEXT,
  files_changed INTEGER,
  insertions INTEGER,
  deletions INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Indexes for performance
CREATE INDEX idx_event_metrics_event ON event_metrics(event_id);
CREATE INDEX idx_event_errors_event ON event_errors(event_id);
CREATE INDEX idx_file_operations_event ON file_operations(event_id);
CREATE INDEX idx_file_operations_path ON file_operations(file_path);
CREATE INDEX idx_git_operations_event ON git_operations(event_id);
```

### Phase 2: Enhanced Hook Scripts (Week 1-2)

#### 2.1 Pre-Tool Hook Enhancement
```python
# .claude/hooks/pre_tool_use_enhanced.py
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "psutil",
#     "tiktoken",
# ]
# ///

import json
import sys
import time
import psutil
import tiktoken

class EnhancedPreToolHook:
    def __init__(self):
        self.start_time = time.time()
        self.encoder = tiktoken.encoding_for_model("gpt-4")
        
    def analyze_tool_input(self, tool_name, tool_input):
        """Analyze tool input for metrics"""
        metrics = {
            "inputTokens": len(self.encoder.encode(json.dumps(tool_input))),
            "contextMemory": psutil.Process().memory_info().rss / 1024 / 1024,  # MB
        }
        
        # File operation analysis
        if tool_name in ["Read", "Write", "Edit", "MultiEdit"]:
            metrics["fileOperation"] = {
                "type": tool_name.lower(),
                "path": tool_input.get("file_path", ""),
                "estimatedSize": len(tool_input.get("content", ""))
            }
            
        # Git operation analysis
        elif tool_name == "Bash":
            command = tool_input.get("command", "")
            if command.startswith("git"):
                metrics["gitOperation"] = {
                    "command": command,
                    "isGitCommand": True
                }
                
        return metrics
    
    def check_dangerous_operations(self, tool_name, tool_input):
        """Enhanced safety checks"""
        dangerous_patterns = {
            "Bash": [
                r"rm\s+-rf\s+/",
                r"chmod\s+777",
                r"sudo\s+rm",
                r">\s*/dev/.*",
            ],
            "Write": [
                r"\.env$",
                r"\.ssh/",
                r"private.*key",
            ]
        }
        
        # Return warnings for dangerous operations
        warnings = []
        if tool_name in dangerous_patterns:
            # Check patterns...
            pass
            
        return warnings

def main():
    try:
        input_data = json.load(sys.stdin)
        hook = EnhancedPreToolHook()
        
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        
        # Analyze metrics
        metrics = hook.analyze_tool_input(tool_name, tool_input)
        
        # Check for dangerous operations
        warnings = hook.check_dangerous_operations(tool_name, tool_input)
        
        # Add metrics to the event
        input_data["metrics"] = metrics
        input_data["warnings"] = warnings
        
        # Output enhanced data
        print(json.dumps(input_data))
        
    except Exception as e:
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

#### 2.2 Post-Tool Hook Enhancement
```python
# .claude/hooks/post_tool_use_enhanced.py
#!/usr/bin/env -S uv run --script

import json
import sys
import time

class EnhancedPostToolHook:
    def __init__(self):
        self.end_time = time.time()
        
    def calculate_execution_time(self, input_data):
        """Calculate tool execution time"""
        # This would need to coordinate with pre-hook timing
        return {
            "executionTime": int((self.end_time - input_data.get("startTime", self.end_time)) * 1000)
        }
    
    def analyze_tool_output(self, tool_name, tool_response):
        """Analyze tool output for metrics"""
        metrics = {}
        
        # Success/failure analysis
        if isinstance(tool_response, dict):
            metrics["success"] = tool_response.get("success", True)
            metrics["hasError"] = "error" in tool_response
            
        # File operation results
        if tool_name in ["Write", "Edit"] and "filePath" in tool_response:
            metrics["fileModified"] = tool_response["filePath"]
            
        return metrics
    
    def detect_patterns(self, session_history):
        """Detect tool usage patterns"""
        # Analyze session history for patterns
        patterns = {
            "toolChain": [],
            "repetitions": 0,
            "parallelExecutions": 0
        }
        return patterns

def main():
    try:
        input_data = json.load(sys.stdin)
        hook = EnhancedPostToolHook()
        
        tool_name = input_data.get("tool_name", "")
        tool_response = input_data.get("tool_response", {})
        
        # Calculate metrics
        timing = hook.calculate_execution_time(input_data)
        output_metrics = hook.analyze_tool_output(tool_name, tool_response)
        
        # Combine metrics
        input_data["metrics"] = {
            **input_data.get("metrics", {}),
            **timing,
            **output_metrics
        }
        
        print(json.dumps(input_data))
        
    except Exception as e:
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Phase 3: Server-Side Processing (Week 2)

#### 3.1 Enhanced Event Processing
```typescript
// apps/server/src/metrics-processor.ts
import { EnhancedHookEvent } from './types';

export class MetricsProcessor {
  processEvent(event: EnhancedHookEvent): ProcessedMetrics {
    const metrics: ProcessedMetrics = {
      performance: this.calculatePerformanceMetrics(event),
      cost: this.calculateCostMetrics(event),
      quality: this.calculateQualityMetrics(event),
      patterns: this.detectPatterns(event)
    };
    
    return metrics;
  }
  
  private calculatePerformanceMetrics(event: EnhancedHookEvent) {
    return {
      executionTime: event.metrics?.executionTime || 0,
      throughput: this.calculateThroughput(event),
      latency: this.calculateLatency(event),
      concurrency: this.detectConcurrency(event)
    };
  }
  
  private calculateCostMetrics(event: EnhancedHookEvent) {
    const tokenUsage = event.metrics?.tokenUsage;
    if (!tokenUsage) return null;
    
    // Cost calculation based on model pricing
    const costPerToken = {
      input: 0.01 / 1000,  // $0.01 per 1K tokens
      output: 0.03 / 1000  // $0.03 per 1K tokens
    };
    
    return {
      inputCost: tokenUsage.input * costPerToken.input,
      outputCost: tokenUsage.output * costPerToken.output,
      totalCost: tokenUsage.total * (costPerToken.input + costPerToken.output) / 2
    };
  }
  
  private detectPatterns(event: EnhancedHookEvent) {
    // Pattern detection logic
    return {
      isRepetitive: false,
      toolChainLength: 0,
      parallelism: false
    };
  }
}
```

#### 3.2 Real-time Analytics Engine
```typescript
// apps/server/src/analytics-engine.ts
export class AnalyticsEngine {
  private metricsCache = new Map<string, AggregatedMetrics>();
  
  async aggregateMetrics(timeWindow: string): Promise<AggregatedMetrics> {
    const cached = this.metricsCache.get(timeWindow);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }
    
    const metrics = await this.calculateAggregates(timeWindow);
    this.metricsCache.set(timeWindow, metrics);
    
    return metrics;
  }
  
  private async calculateAggregates(timeWindow: string) {
    // Query database for time window
    const events = await db.getEventsInTimeWindow(timeWindow);
    
    return {
      toolUsage: this.aggregateToolUsage(events),
      errorRates: this.calculateErrorRates(events),
      performance: this.aggregatePerformance(events),
      costs: this.aggregateCosts(events),
      fileOperations: this.aggregateFileOps(events),
      gitActivity: this.aggregateGitOps(events)
    };
  }
  
  streamAnalytics(ws: WebSocket) {
    // Real-time streaming of analytics
    const interval = setInterval(async () => {
      const metrics = await this.aggregateMetrics('1m');
      ws.send(JSON.stringify({
        type: 'analytics',
        data: metrics
      }));
    }, 5000); // Update every 5 seconds
    
    ws.on('close', () => clearInterval(interval));
  }
}
```

### Phase 4: Enhanced UI Components (Week 2-3)

#### 4.1 Advanced Metrics Dashboard
```vue
<!-- apps/client/src/components/MetricsDashboard.vue -->
<template>
  <div class="metrics-dashboard grid grid-cols-4 gap-4">
    <!-- Performance Metrics -->
    <MetricCard
      title="Performance"
      :value="metrics.performance.avgExecutionTime"
      unit="ms"
      :trend="metrics.performance.trend"
      :sparkline="metrics.performance.history"
    />
    
    <!-- Cost Tracking -->
    <MetricCard
      title="Token Cost"
      :value="metrics.cost.total"
      unit="$"
      :trend="metrics.cost.trend"
      :alert="metrics.cost.alert"
    />
    
    <!-- Error Rate -->
    <MetricCard
      title="Error Rate"
      :value="metrics.errors.rate"
      unit="%"
      :status="getErrorStatus(metrics.errors.rate)"
    />
    
    <!-- File Operations -->
    <MetricCard
      title="File Ops/min"
      :value="metrics.fileOps.rate"
      :breakdown="metrics.fileOps.types"
    />
  </div>
  
  <!-- Detailed Charts -->
  <div class="charts-section mt-6">
    <ToolUsageHeatmap :data="toolUsageData" />
    <PerformanceTrends :data="performanceData" />
    <CostBreakdown :data="costData" />
    <ErrorAnalysis :data="errorData" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMetrics } from '@/composables/useMetrics';
import MetricCard from './MetricCard.vue';
import ToolUsageHeatmap from './charts/ToolUsageHeatmap.vue';
import PerformanceTrends from './charts/PerformanceTrends.vue';
import CostBreakdown from './charts/CostBreakdown.vue';
import ErrorAnalysis from './charts/ErrorAnalysis.vue';

const { metrics, toolUsageData, performanceData, costData, errorData } = useMetrics();

const getErrorStatus = (rate: number) => {
  if (rate < 1) return 'healthy';
  if (rate < 5) return 'warning';
  return 'critical';
};
</script>
```

#### 4.2 Pattern Recognition Visualizer
```vue
<!-- apps/client/src/components/PatternVisualizer.vue -->
<template>
  <div class="pattern-visualizer">
    <h3 class="text-lg font-semibold mb-4">Detected Patterns</h3>
    
    <!-- Tool Chain Visualization -->
    <div class="tool-chains">
      <h4>Common Tool Sequences</h4>
      <div v-for="chain in patterns.toolChains" :key="chain.id" class="chain">
        <ToolChainFlow :sequence="chain.sequence" :frequency="chain.frequency" />
      </div>
    </div>
    
    <!-- Anomaly Detection -->
    <div class="anomalies mt-6">
      <h4>Anomalies Detected</h4>
      <AnomalyList :anomalies="patterns.anomalies" @investigate="investigateAnomaly" />
    </div>
    
    <!-- Optimization Suggestions -->
    <div class="suggestions mt-6">
      <h4>Optimization Opportunities</h4>
      <SuggestionCard
        v-for="suggestion in patterns.suggestions"
        :key="suggestion.id"
        :suggestion="suggestion"
        @apply="applySuggestion"
      />
    </div>
  </div>
</template>
```

### Phase 5: Advanced Analytics Features (Week 3-4)

#### 5.1 Machine Learning Integration
```typescript
// apps/server/src/ml/anomaly-detector.ts
export class AnomalyDetector {
  private model: IsolationForest;
  
  constructor() {
    this.model = new IsolationForest({
      nEstimators: 100,
      maxSamples: 256
    });
  }
  
  async trainModel(historicalData: EnhancedHookEvent[]) {
    const features = this.extractFeatures(historicalData);
    await this.model.fit(features);
  }
  
  detectAnomalies(event: EnhancedHookEvent): AnomalyResult {
    const features = this.extractEventFeatures(event);
    const anomalyScore = this.model.predict(features);
    
    return {
      isAnomaly: anomalyScore > 0.7,
      score: anomalyScore,
      reasons: this.explainAnomaly(event, anomalyScore)
    };
  }
  
  private extractFeatures(events: EnhancedHookEvent[]): number[][] {
    return events.map(event => [
      event.metrics?.executionTime || 0,
      event.metrics?.tokenUsage?.total || 0,
      event.error ? 1 : 0,
      // Add more features...
    ]);
  }
}
```

#### 5.2 Predictive Analytics
```typescript
// apps/server/src/ml/predictor.ts
export class PerformancePredictor {
  predictResourceNeeds(currentMetrics: AggregatedMetrics): Prediction {
    // Time series analysis for resource prediction
    const tokenUsageTrend = this.analyzeTimeSeries(currentMetrics.tokenHistory);
    const executionTimeTrend = this.analyzeTimeSeries(currentMetrics.executionHistory);
    
    return {
      expectedTokenUsage: this.forecastValue(tokenUsageTrend, 60), // Next hour
      expectedLoad: this.forecastValue(executionTimeTrend, 60),
      recommendedScaling: this.calculateScalingRecommendation(tokenUsageTrend)
    };
  }
  
  predictCostOverrun(currentSpend: number, budget: number): CostPrediction {
    const burnRate = this.calculateBurnRate(currentSpend);
    const timeToOverrun = (budget - currentSpend) / burnRate;
    
    return {
      willOverrun: timeToOverrun < 24, // Hours
      estimatedOverrunTime: timeToOverrun,
      recommendedActions: this.generateCostSavingActions(burnRate)
    };
  }
}
```

### Phase 6: Alerting and Automation (Week 4)

#### 6.1 Smart Alert System
```typescript
// apps/server/src/alerting/alert-manager.ts
export class AlertManager {
  private rules: AlertRule[] = [
    {
      name: 'HighErrorRate',
      condition: (metrics) => metrics.errors.rate > 5,
      severity: 'critical',
      actions: ['notify', 'pauseAgent']
    },
    {
      name: 'CostOverrun',
      condition: (metrics) => metrics.cost.hourly > metrics.cost.budget * 0.1,
      severity: 'warning',
      actions: ['notify', 'throttle']
    },
    {
      name: 'PerformanceDegradation',
      condition: (metrics) => metrics.performance.p95 > metrics.performance.baseline * 2,
      severity: 'warning',
      actions: ['notify', 'investigate']
    }
  ];
  
  async checkAlerts(metrics: AggregatedMetrics) {
    const triggeredAlerts = this.rules.filter(rule => rule.condition(metrics));
    
    for (const alert of triggeredAlerts) {
      await this.executeActions(alert, metrics);
    }
  }
  
  private async executeActions(alert: AlertRule, metrics: AggregatedMetrics) {
    for (const action of alert.actions) {
      switch (action) {
        case 'notify':
          await this.sendNotification(alert, metrics);
          break;
        case 'pauseAgent':
          await this.pauseAgentExecution();
          break;
        case 'throttle':
          await this.throttleRequests();
          break;
      }
    }
  }
}
```

#### 6.2 Auto-remediation
```typescript
// apps/server/src/automation/auto-remediation.ts
export class AutoRemediation {
  async handleError(error: ErrorEvent): Promise<RemediationResult> {
    const strategy = this.selectStrategy(error);
    
    switch (strategy) {
      case 'retry':
        return await this.retryWithBackoff(error);
      case 'fallback':
        return await this.executeFallback(error);
      case 'repair':
        return await this.attemptRepair(error);
      case 'escalate':
        return await this.escalateToHuman(error);
    }
  }
  
  private selectStrategy(error: ErrorEvent): RemediationStrategy {
    // ML-based strategy selection
    if (error.type === 'NetworkError' && error.retryCount < 3) {
      return 'retry';
    }
    if (error.type === 'ToolError' && this.hasFallbackTool(error.tool)) {
      return 'fallback';
    }
    if (error.type === 'FileSystemError' && this.canRepair(error)) {
      return 'repair';
    }
    return 'escalate';
  }
}
```

## Deployment Strategy

### Step 1: Gradual Rollout
1. Deploy enhanced hooks to test environment
2. Run parallel with existing system for validation
3. Compare metrics accuracy
4. Gradually increase traffic to new system

### Step 2: Migration Path
1. Database migration with zero downtime
2. Backward compatibility for existing events
3. Feature flags for new capabilities
4. Rollback plan for each component

### Step 3: Performance Optimization
1. Implement caching layers
2. Use time-series databases for metrics
3. Optimize query patterns
4. Implement data retention policies

## Monitoring the Monitor

### Self-Monitoring Metrics
- Hook execution overhead
- Data processing latency
- Storage growth rate
- Query performance
- Alert accuracy

### Health Checks
```typescript
export class MonitoringHealth {
  async checkHealth(): Promise<HealthStatus> {
    return {
      dataIngestion: await this.checkIngestionRate(),
      processing: await this.checkProcessingLatency(),
      storage: await this.checkStorageHealth(),
      analytics: await this.checkAnalyticsAccuracy(),
      alerts: await this.checkAlertingSystem()
    };
  }
}
```

## Conclusion

This implementation guide provides a comprehensive roadmap for enhancing the Claude Code observability system. The phased approach ensures gradual improvement while maintaining system stability. Key benefits include:

1. **Complete Visibility**: Track every aspect of agent behavior
2. **Proactive Management**: Detect and prevent issues before impact
3. **Cost Optimization**: Monitor and control token usage
4. **Performance Excellence**: Identify and eliminate bottlenecks
5. **Intelligent Automation**: Self-healing and optimization

The enhanced system transforms basic event tracking into a comprehensive observability platform that enables data-driven optimization of Claude Code agents.