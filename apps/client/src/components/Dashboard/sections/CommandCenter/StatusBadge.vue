<template>
  <span 
    class="status-badge"
    :class="`status-${status}`"
  >
    <span class="status-icon">{{ getStatusIcon() }}</span>
    <span class="status-text">{{ getStatusText() }}</span>
  </span>
</template>

<script setup lang="ts">
interface Props {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
}

const props = defineProps<Props>();

const getStatusIcon = () => {
  const icons = {
    queued: '⏳',
    running: '🔄',
    completed: '✅',
    failed: '❌',
    cancelled: '⏹️'
  };
  return icons[props.status];
};

const getStatusText = () => {
  return props.status.charAt(0).toUpperCase() + props.status.slice(1);
};
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-queued {
  background: #FEF3C7;
  color: #92400E;
}

.status-running {
  background: #DBEAFE;
  color: #1E40AF;
}

.status-completed {
  background: #D1FAE5;
  color: #065F46;
}

.status-failed {
  background: #FEE2E2;
  color: #991B1B;
}

.status-cancelled {
  background: #F3F4F6;
  color: #374151;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .status-queued {
    background: #451A03;
    color: #FBBF24;
  }

  .status-running {
    background: #1E3A8A;
    color: #60A5FA;
  }

  .status-completed {
    background: #064E3B;
    color: #34D399;
  }

  .status-failed {
    background: #7F1D1D;
    color: #FCA5A5;
  }

  .status-cancelled {
    background: #1F2937;
    color: #9CA3AF;
  }
}
</style>