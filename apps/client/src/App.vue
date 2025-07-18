<template>
  <div class="h-screen flex flex-col bg-[var(--theme-bg-secondary)]">
    <!-- Header with Primary Theme Colors -->
    <header class="bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-light)] shadow-lg border-b-2 border-[var(--theme-primary-dark)]">
      <div class="px-3 py-4 mobile:py-2 mobile:flex-col mobile:space-y-2 flex items-center justify-between">
        <!-- Title Section -->
        <div class="mobile:w-full mobile:text-center">
          <h1 class="text-2xl mobile:text-lg font-bold text-white drop-shadow-lg">
            Multi-Agent Observability
          </h1>
        </div>
        
        <!-- Connection Status -->
        <div class="mobile:w-full mobile:justify-center flex items-center space-x-1.5">
          <div v-if="isConnected" class="flex items-center space-x-1.5">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span class="text-base mobile:text-sm text-white font-semibold drop-shadow-md">Connected</span>
          </div>
          <div v-else class="flex items-center space-x-1.5">
            <span class="relative flex h-3 w-3">
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span class="text-base mobile:text-sm text-white font-semibold drop-shadow-md">Disconnected</span>
          </div>
        </div>
        
        <!-- Event Count and Theme Toggle -->
        <div class="mobile:w-full mobile:justify-center flex items-center space-x-2">
          <span class="text-base mobile:text-sm text-white font-semibold drop-shadow-md bg-[var(--theme-primary-dark)] px-3 py-1.5 rounded-full border border-white/30">
            {{ events.length }} events
          </span>
          
          <!-- Dashboard Toggle Button -->
          <button
            @click="showDashboard = !showDashboard"
            class="p-3 mobile:p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl"
            :title="showDashboard ? 'Hide enhanced dashboard' : 'Show enhanced dashboard'"
          >
            <span class="text-2xl mobile:text-lg">🏗️</span>
          </button>
          
          <!-- Filters Toggle Button -->
          <button
            @click="showFilters = !showFilters"
            class="p-3 mobile:p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl"
            :title="showFilters ? 'Hide filters' : 'Show filters'"
          >
            <span class="text-2xl mobile:text-lg">📊</span>
          </button>
          
          <!-- Theme Manager Button -->
          <button
            @click="handleThemeManagerClick"
            class="p-3 mobile:p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl"
            title="Open theme manager"
          >
            <span class="text-2xl mobile:text-lg">🎨</span>
          </button>
        </div>
      </div>
    </header>
    
    <!-- Enhanced Dashboard View -->
    <DashboardRealTime v-if="showDashboard" />
    
    <!-- Original Observability View -->
    <div v-else class="flex flex-col flex-1">
      <!-- Filters -->
      <FilterPanel
        v-if="showFilters"
        :filters="filters"
        @update:filters="filters = $event"
      />
      
      <!-- Live Pulse Chart -->
      <LivePulseChart
        :events="events"
        :filters="filters"
      />
      
      <!-- Timeline -->
      <EventTimeline
        :events="events"
        :filters="filters"
        v-model:stick-to-bottom="stickToBottom"
      />
      
      <!-- Stick to bottom button -->
      <StickScrollButton
        :stick-to-bottom="stickToBottom"
        @toggle="stickToBottom = !stickToBottom"
      />
    </div>
    
    <!-- Error message -->
    <div
      v-if="error"
      class="fixed bottom-4 left-4 mobile:bottom-3 mobile:left-3 mobile:right-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 mobile:px-2 mobile:py-1.5 rounded mobile:text-xs"
    >
      {{ error }}
    </div>
    
    <!-- Theme Manager -->
    <ThemeManager 
      :is-open="showThemeManager"
      @close="showThemeManager = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWebSocket } from './composables/useWebSocket';
import { useThemes } from './composables/useThemes';
import EventTimeline from './components/EventTimeline.vue';
import FilterPanel from './components/FilterPanel.vue';
import StickScrollButton from './components/StickScrollButton.vue';
import LivePulseChart from './components/LivePulseChart.vue';
import ThemeManager from './components/ThemeManager.vue';
import DashboardRealTime from './components/Dashboard/DashboardRealTime.vue';
import DashboardBasic from './components/Dashboard/DashboardBasic.vue';

// WebSocket connection - try to connect but don't fail if server is down
const { events, isConnected, error } = useWebSocket('ws://localhost:4000/stream');

// Theme management
const { state: themeState } = useThemes();

// Filters
const filters = ref({
  sourceApp: '',
  sessionId: '',
  eventType: ''
});

// UI state
const stickToBottom = ref(true);
const showThemeManager = ref(false);
const showFilters = ref(false);
const showDashboard = ref(false);
const dashboardError = ref(false);

// Computed properties
const isDark = computed(() => {
  return themeState.value.currentTheme === 'dark' || 
         (themeState.value.isCustomTheme && 
          themeState.value.customThemes.find(t => t.id === themeState.value.currentTheme)?.name.includes('dark'));
});

// Debug handler for theme manager
const handleThemeManagerClick = () => {
  console.log('Theme manager button clicked!');
  showThemeManager.value = true;
};

// Dashboard error handling
const resetDashboard = () => {
  dashboardError.value = false;
  // Force component re-render
  showDashboard.value = false;
  setTimeout(() => {
    showDashboard.value = true;
  }, 100);
};

// Global error handler for dashboard
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('Dashboard')) {
    dashboardError.value = true;
    event.preventDefault();
  }
});
</script>

<style scoped>
.dashboard-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

.error-content {
  text-align: center;
  padding: 2rem;
  background: var(--theme-bg-secondary);
  border-radius: 0.5rem;
  border: 1px solid var(--theme-border);
  max-width: 500px;
}

.error-content h2 {
  color: #EF4444;
  margin-bottom: 1rem;
}

.error-content p {
  margin-bottom: 2rem;
  color: var(--theme-text-secondary);
}

.reset-button,
.back-button {
  padding: 0.75rem 1.5rem;
  margin: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.reset-button {
  background: var(--theme-primary);
  color: white;
}

.reset-button:hover {
  background: var(--theme-primary-dark);
}

.back-button {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
}

.back-button:hover {
  background: var(--theme-bg-primary);
}
</style>