<template>
  <div class="metrics-display">
    <div class="metrics-placeholder">
      <div class="placeholder-icon">📊</div>
      <h3>Performance Metrics</h3>
      <p>Real-time performance metrics and charts will be displayed here.</p>
      <div class="feature-list">
        <ul>
          <li>CPU and Memory usage charts</li>
          <li>Network I/O monitoring</li>
          <li>Response time metrics</li>
          <li>Alert thresholds</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PerformanceMetric } from '../../../../types/dashboard.types';

interface Props {
  metrics: PerformanceMetric[];
  expanded: boolean;
  showCharts: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'metric-click': [metric: PerformanceMetric];
}>();
</script>

<style scoped>
.metrics-display {
  padding: 2rem;
  height: 100%;
}

.metrics-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  color: var(--theme-text-secondary);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.feature-list {
  margin-top: 1rem;
}

.feature-list ul {
  list-style: none;
  padding: 0;
}

.feature-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--theme-border);
}

.feature-list li:last-child {
  border-bottom: none;
}
</style>