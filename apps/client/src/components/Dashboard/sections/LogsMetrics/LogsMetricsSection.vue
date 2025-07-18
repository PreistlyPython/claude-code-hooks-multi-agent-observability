<template>
  <div class="logs-metrics-section">
    <!-- Category Tabs -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-tab"
        :class="{ active: activeCategory === category.id }"
        @click="activeCategory = category.id"
      >
        {{ category.label }}
        <span class="category-count">{{ category.count }}</span>
        <span v-if="category.hasErrors" class="error-indicator">⚠️</span>
      </button>
    </div>

    <!-- Category Content -->
    <div class="category-content">
      <!-- System Logs -->
      <LogViewer
        v-if="activeCategory === 'system'"
        :logs="logs"
        :expanded="expanded"
        :show-filters="true"
        @filter-change="handleLogFilter"
      />

      <!-- Performance Metrics -->
      <MetricsDisplay
        v-else-if="activeCategory === 'performance'"
        :metrics="metrics"
        :expanded="expanded"
        :show-charts="true"
        @metric-click="handleMetricClick"
      />

      <!-- Error Logs -->
      <ErrorViewer
        v-else-if="activeCategory === 'errors'"
        :errors="errors"
        :expanded="expanded"
        :show-analysis="true"
        @error-click="handleErrorClick"
      />

      <!-- Audit Trail -->
      <AuditViewer
        v-else-if="activeCategory === 'audit'"
        :audit="audit"
        :expanded="expanded"
        :show-compliance="true"
        @audit-click="handleAuditClick"
      />
    </div>

    <!-- Quick Stats Bar -->
    <div class="quick-stats">
      <div class="stat-item">
        <span class="stat-label">Total Entries:</span>
        <span class="stat-value">{{ totalEntries }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Error Rate:</span>
        <span class="stat-value" :class="{ 'high-error': errorRate > 5 }">
          {{ errorRate.toFixed(1) }}%
        </span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Last Updated:</span>
        <span class="stat-value">{{ formatTime(lastUpdated) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LogViewer from './LogViewer.vue';
import MetricsDisplay from './MetricsDisplay.vue';
import ErrorViewer from './ErrorViewer.vue';
import AuditViewer from './AuditViewer.vue';
import type { LogEntry, PerformanceMetric, ErrorEntry, AuditEntry } from '../../../../types/dashboard.types';

interface Props {
  logs: LogEntry[];
  metrics: PerformanceMetric[];
  errors: ErrorEntry[];
  audit: AuditEntry[];
  expanded: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'category-toggle': [category: string];
}>();

// State
const activeCategory = ref('system');
const lastUpdated = ref(new Date());

// Computed
const categories = computed(() => [
  {
    id: 'system',
    label: 'System Logs',
    count: props.logs.length,
    hasErrors: props.logs.some(log => log.level === 'error')
  },
  {
    id: 'performance',
    label: 'Performance',
    count: props.metrics.length,
    hasErrors: props.metrics.some(metric => metric.status === 'critical')
  },
  {
    id: 'errors',
    label: 'Errors',
    count: props.errors.length,
    hasErrors: props.errors.length > 0
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    count: props.audit.length,
    hasErrors: props.audit.some(entry => entry.severity === 'high')
  }
]);

const totalEntries = computed(() => {
  return props.logs.length + props.metrics.length + props.errors.length + props.audit.length;
});

const errorRate = computed(() => {
  const totalErrors = props.errors.length + props.logs.filter(log => log.level === 'error').length;
  return totalEntries.value > 0 ? (totalErrors / totalEntries.value) * 100 : 0;
});

// Methods
const handleLogFilter = (filter: any) => {
  console.log('Log filter changed:', filter);
  // Implement log filtering logic
};

const handleMetricClick = (metric: PerformanceMetric) => {
  console.log('Metric clicked:', metric);
  // Implement metric detail view
};

const handleErrorClick = (error: ErrorEntry) => {
  console.log('Error clicked:', error);
  // Implement error detail view
};

const handleAuditClick = (audit: AuditEntry) => {
  console.log('Audit clicked:', audit);
  // Implement audit detail view
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString();
};

// Update last updated timestamp when data changes
const updateTimestamp = () => {
  lastUpdated.value = new Date();
};

// Watch for data changes to update timestamp
const watchData = () => {
  updateTimestamp();
};

// Set up watchers for all data props
const unwatchLogs = () => watchData();
const unwatchMetrics = () => watchData();
const unwatchErrors = () => watchData();
const unwatchAudit = () => watchData();
</script>

<style scoped>
.logs-metrics-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--theme-bg-primary);
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1rem 0 1rem;
  border-bottom: 2px solid var(--theme-border);
  background: var(--theme-bg-secondary);
}

.category-tab {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: var(--theme-text-secondary);
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.375rem 0.375rem 0 0;
}

.category-tab:hover {
  color: var(--theme-text-primary);
  background: var(--theme-bg-tertiary);
}

.category-tab.active {
  color: var(--theme-primary);
  background: var(--theme-bg-primary);
  border-bottom-color: var(--theme-primary);
}

.category-count {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-secondary);
  padding: 0.125rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.category-tab.active .category-count {
  background: var(--theme-primary);
  color: white;
}

.error-indicator {
  font-size: 0.875rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Category Content */
.category-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* Quick Stats Bar */
.quick-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--theme-bg-tertiary);
  border-top: 1px solid var(--theme-border);
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  text-align: center;
  min-width: 120px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.stat-value.high-error {
  color: #ef4444;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .logs-metrics-section {
    background: #0f172a;
  }

  .category-tabs {
    background: #1e293b;
    border-color: #334155;
  }

  .category-tab.active {
    background: #0f172a;
  }

  .quick-stats {
    background: #1e293b;
    border-color: #334155;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .category-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0.75rem 0.75rem 0 0.75rem;
  }

  .category-tab {
    padding: 0.5rem 1rem;
    white-space: nowrap;
    min-width: fit-content;
  }

  .category-content {
    padding: 0.75rem;
  }

  .quick-stats {
    flex-direction: column;
    gap: 1rem;
    padding: 0.75rem;
  }

  .stat-item {
    min-width: auto;
  }
}
</style>