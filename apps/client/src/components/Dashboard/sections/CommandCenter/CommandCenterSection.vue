<template>
  <div class="command-center-section">
    <!-- Tabs Navigation -->
    <div class="tabs-navigation">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filter-group">
        <input
          v-model="localFilters.searchQuery"
          type="text"
          placeholder="Search commands..."
          class="search-input"
          @input="debounceFilterUpdate"
        />
      </div>
      
      <div class="filter-group">
        <select v-model="localFilters.agentId" @change="updateFilters" class="filter-select">
          <option value="">All Agents</option>
          <option v-for="agent in availableAgents" :key="agent" :value="agent">
            {{ agent }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="localFilters.timeRange" @change="updateFilters" class="filter-select">
          <option value="last-hour">Last Hour</option>
          <option value="last-24h">Last 24 Hours</option>
          <option value="last-week">Last Week</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <button @click="clearFilters" class="clear-filters-btn">
        Clear Filters
      </button>
    </div>

    <!-- Commands Display -->
    <div class="commands-container">
      <!-- Table View -->
      <CommandTable
        v-if="viewMode === 'table'"
        :commands="filteredCommands"
        :loading="loading"
        @command-action="handleCommandAction"
      />

      <!-- Card View -->
      <CommandCards
        v-else-if="viewMode === 'cards'"
        :commands="filteredCommands"
        :loading="loading"
        @command-action="handleCommandAction"
      />

      <!-- Timeline View -->
      <CommandTimeline
        v-else-if="viewMode === 'timeline'"
        :commands="filteredCommands"
        :loading="loading"
        @command-action="handleCommandAction"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="currentPage = 1"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        First
      </button>
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        Next
      </button>
      <button
        @click="currentPage = totalPages"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        Last
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import CommandTable from './CommandTable.vue';
import CommandCards from './CommandCards.vue';
import CommandTimeline from './CommandTimeline.vue';
import type { Command, CommandFilters } from '../../../../types/dashboard.types';

interface Props {
  commands: Command[];
  viewMode: 'table' | 'cards' | 'timeline';
  filters: CommandFilters;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'filter-change': [filters: CommandFilters];
  'command-action': [action: { command: Command; type: string }];
}>();

// State
const activeTab = ref('active');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const loading = ref(false);
const localFilters = ref<CommandFilters>({ ...props.filters });

// Computed
const tabs = computed(() => [
  {
    id: 'active',
    label: 'Active',
    count: props.commands.filter(c => c.status === 'running').length
  },
  {
    id: 'queued',
    label: 'Queued',
    count: props.commands.filter(c => c.status === 'queued').length
  },
  {
    id: 'completed',
    label: 'Completed',
    count: props.commands.filter(c => c.status === 'completed').length
  },
  {
    id: 'failed',
    label: 'Failed',
    count: props.commands.filter(c => c.status === 'failed').length
  }
]);

const availableAgents = computed(() => {
  const agents = new Set(props.commands.map(c => c.agentId));
  return Array.from(agents).sort();
});

const filteredByTab = computed(() => {
  switch (activeTab.value) {
    case 'active':
      return props.commands.filter(c => c.status === 'running');
    case 'queued':
      return props.commands.filter(c => c.status === 'queued');
    case 'completed':
      return props.commands.filter(c => c.status === 'completed');
    case 'failed':
      return props.commands.filter(c => c.status === 'failed');
    default:
      return props.commands;
  }
});

const filteredCommands = computed(() => {
  let filtered = filteredByTab.value;

  // Apply search filter
  if (localFilters.value.searchQuery) {
    const query = localFilters.value.searchQuery.toLowerCase();
    filtered = filtered.filter(cmd =>
      cmd.type.toLowerCase().includes(query) ||
      cmd.id.toLowerCase().includes(query) ||
      (cmd.output && cmd.output.toLowerCase().includes(query))
    );
  }

  // Apply agent filter
  if (localFilters.value.agentId) {
    filtered = filtered.filter(cmd => cmd.agentId === localFilters.value.agentId);
  }

  // Apply time range filter
  if (localFilters.value.timeRange && localFilters.value.timeRange !== 'all') {
    const now = Date.now();
    const ranges: Record<string, number> = {
      'last-hour': 60 * 60 * 1000,
      'last-24h': 24 * 60 * 60 * 1000,
      'last-week': 7 * 24 * 60 * 60 * 1000
    };
    const range = ranges[localFilters.value.timeRange];
    if (range) {
      filtered = filtered.filter(cmd => 
        new Date(cmd.timestamp).getTime() > now - range
      );
    }
  }

  // Apply pagination
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filtered.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredByTab.value.length / itemsPerPage.value);
});

// Methods
let filterTimeout: NodeJS.Timeout;
const debounceFilterUpdate = () => {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    updateFilters();
  }, 300);
};

const updateFilters = () => {
  emit('filter-change', { ...localFilters.value });
};

const clearFilters = () => {
  localFilters.value = {
    status: 'all',
    agentId: '',
    timeRange: 'last-hour',
    searchQuery: ''
  };
  updateFilters();
};

const handleCommandAction = (action: { command: Command; type: string }) => {
  emit('command-action', action);
};

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

// Reset page when filters change
watch(filteredByTab, () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.command-center-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
}

/* Tabs Navigation */
.tabs-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--theme-border);
  padding-bottom: 0;
}

.tab-button {
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
}

.tab-button:hover {
  color: var(--theme-text-primary);
}

.tab-button.active {
  color: var(--theme-primary);
  border-bottom-color: var(--theme-primary);
}

.tab-count {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-secondary);
  padding: 0.125rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-button.active .tab-count {
  background: var(--theme-primary);
  color: white;
}

/* Filters Bar */
.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--theme-bg-tertiary);
  border-radius: 0.5rem;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.search-input,
.filter-select {
  width: 100%;
  padding: 0.5rem 1rem;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--theme-primary);
}

.clear-filters-btn {
  padding: 0.5rem 1rem;
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background: var(--theme-primary);
  color: white;
  border-color: var(--theme-primary);
}

/* Commands Container */
.commands-container {
  flex: 1;
  overflow-y: auto;
  background: var(--theme-bg-primary);
  border-radius: 0.5rem;
  border: 1px solid var(--theme-border);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: var(--theme-bg-tertiary);
  border-radius: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--theme-primary);
  color: white;
  border-color: var(--theme-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  padding: 0 1rem;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .command-center-section {
    background: #0f172a;
  }

  .filters-bar {
    background: #1e293b;
  }

  .search-input,
  .filter-select {
    background: #0f172a;
    border-color: #334155;
  }

  .commands-container {
    background: #0f172a;
    border-color: #334155;
  }

  .pagination {
    background: #1e293b;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .command-center-section {
    padding: 0.75rem;
  }

  .tabs-navigation {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-button {
    padding: 0.5rem 1rem;
    white-space: nowrap;
  }

  .filters-bar {
    padding: 0.75rem;
  }

  .filter-group {
    min-width: 150px;
  }

  .pagination {
    flex-wrap: wrap;
    padding: 0.75rem;
  }
}
</style>