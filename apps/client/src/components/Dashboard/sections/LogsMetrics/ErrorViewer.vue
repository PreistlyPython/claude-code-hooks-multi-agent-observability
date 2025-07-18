<template>
  <div class="error-viewer">
    <div class="error-viewer-placeholder">
      <div class="placeholder-icon">🚨</div>
      <h3>Error Viewer</h3>
      <p>Error logs and analysis will be displayed here with debugging tools.</p>
      <div class="feature-list">
        <ul>
          <li>Error categorization and grouping</li>
          <li>Stack trace analysis</li>
          <li>Error frequency tracking</li>
          <li>Auto-resolution suggestions</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ErrorEntry } from '../../../../types/dashboard.types';

interface Props {
  errors: ErrorEntry[];
  expanded: boolean;
  showAnalysis: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'error-click': [error: ErrorEntry];
}>();
</script>

<style scoped>
.error-viewer {
  padding: 2rem;
  height: 100%;
}

.error-viewer-placeholder {
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