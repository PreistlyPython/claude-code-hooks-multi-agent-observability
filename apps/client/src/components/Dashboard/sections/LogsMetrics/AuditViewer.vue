<template>
  <div class="audit-viewer">
    <div class="audit-viewer-placeholder">
      <div class="placeholder-icon">🔍</div>
      <h3>Audit Trail</h3>
      <p>Security and compliance audit logs will be displayed here.</p>
      <div class="feature-list">
        <ul>
          <li>User action tracking</li>
          <li>Compliance monitoring</li>
          <li>Security event alerts</li>
          <li>Audit report generation</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AuditEntry } from '../../../../types/dashboard.types';

interface Props {
  audit: AuditEntry[];
  expanded: boolean;
  showCompliance: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'audit-click': [audit: AuditEntry];
}>();
</script>

<style scoped>
.audit-viewer {
  padding: 2rem;
  height: 100%;
}

.audit-viewer-placeholder {
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