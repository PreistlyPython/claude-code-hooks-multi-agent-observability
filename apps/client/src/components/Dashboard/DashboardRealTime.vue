<template>
  <div class="dashboard-realtime">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">
          🏗️ Enhanced Multi-Agent Observability Dashboard
          <span class="connection-status" :class="{ connected: isConnected, disconnected: !isConnected }">
            {{ isConnected ? '🟢 Connected' : '🔴 Disconnected' }}
          </span>
        </h1>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-label">Sessions</span>
            <span class="stat-value">{{ sessionColumns.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Events</span>
            <span class="stat-value">{{ totalEvents }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Events/min</span>
            <span class="stat-value">{{ eventsPerMinute }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Logo Stream Timeline -->
    <section class="logo-stream-section">
      <div class="timeline-container">
        <div class="timeline-header">
          <div class="timeline-title-section">
            <button 
              @click="isTimelineCollapsed = !isTimelineCollapsed"
              class="collapse-button"
              :title="isTimelineCollapsed ? 'Expand timeline' : 'Collapse timeline'"
            >
              <span class="collapse-icon">{{ isTimelineCollapsed ? '▶' : '▼' }}</span>
            </button>
            <h2>🚀 Agent Activity Timeline</h2>
          </div>
          <div class="timeline-controls">
            <span class="timeline-range">Last 10 minutes</span>
            <div class="debug-info">
              <span class="debug-badge">Icons: {{ iconCallCount }}</span>
              <span class="debug-badge error" v-if="clipboardIconCalls > 0">📋: {{ clipboardIconCalls }}</span>
            </div>
          </div>
        </div>
        
        <!-- Collapsible Timeline Content -->
        <Transition name="timeline-collapse">
          <div v-show="!isTimelineCollapsed" class="timeline-content">
            <!-- Time Labels -->
            <div class="timeline-labels">
              <div v-for="label in timeLabels" :key="label.position" class="time-label" :style="{ left: label.position + '%' }">
                <div class="time-pst">{{ label.pst }}</div>
                <div class="time-relative">{{ label.relative }}</div>
              </div>
            </div>
            
            <!-- Session Rows -->
            <div class="session-rows">
              <div v-for="session in sessionColumns" :key="session.sessionId" class="session-row">
                <div class="session-label">
                  <span class="session-icon-small">{{ getSessionIcon(session) }}</span>
                  <div class="session-name-container">
                    <span class="session-name-full">{{ session.sessionName }}</span>
                    <span class="session-id-small">{{ session.sessionId.substring(0, 8) }}</span>
                  </div>
                </div>
                <div class="timeline-track">
                  <div v-for="(event, idx) in getTimelineEvents(session)" 
                       :key="event.id || event.timestamp"
                       class="timeline-event"
                       :class="`event-${event.hook_event_type || 'unknown'}`"
                       :style="getTimelinePosition({...event, index: idx})"
                       :title="`${event.hook_event_type || 'unknown'} at ${formatPSTTime(event.timestamp)}`"
                       @click="debugEventClick(event, idx)">
                    <span class="event-icon-small">{{ getEventIcon(event.hook_event_type || 'pre_tool_use') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </section>

    <!-- Main Dashboard -->
    <div class="dashboard-main">
      <!-- Session Columns -->
      <div class="session-columns" v-if="sessionColumns.length > 0">
        <div 
          v-for="session in sessionColumns"
          :key="session.sessionId"
          class="session-column"
          :class="{ active: session.isActive }"
        >
          <!-- Session Header -->
          <div class="session-header">
            <div class="session-info">
              <div class="session-icon" :class="getSessionIconClass(session)">
                {{ getSessionIcon(session) }}
              </div>
              <div class="session-details">
                <h3 class="session-title">{{ session.sessionName }}</h3>
                <p class="session-id">{{ session.sessionId.substring(0, 8) }}...</p>
                <p class="session-stats">
                  {{ session.events.length }} events • {{ session.sourceApp }}
                </p>
              </div>
            </div>
            <div class="session-activity">
              <div class="activity-pulse" v-if="session.isActive"></div>
              <div class="time-display">
                <span class="last-activity-pst">{{ formatPSTTime(session.lastActivity) }}</span>
                <span class="last-activity-relative">{{ formatRelativeTime(session.lastActivity) }}</span>
              </div>
            </div>
          </div>

          <!-- Event Stack - Scrollable List -->
          <div class="event-stack">
            <div class="events-scroll-container">
              <div 
                v-for="(event, index) in session.events"
                :key="event.id || index"
                class="event-card"
                :class="[
                  `event-${event.hook_event_type}`,
                  { 'new-event': event.isNew }
                ]"
                @click="selectEvent(event)"
              >
                <div class="event-header">
                  <div class="event-icon">
                    {{ getEventIcon(event.hook_event_type || 'pre_tool_use') }}
                  </div>
                  <div class="event-type">
                    {{ event.hook_event_type || 'pre_tool_use' }}
                  </div>
                  <div class="event-time">
                    <div class="time-pst">{{ formatPSTTime(event.timestamp) }}</div>
                    <div class="time-relative">{{ formatRelativeTime(event.timestamp) }}</div>
                  </div>
                </div>
                <div class="event-content">
                  <div class="event-summary">
                    {{ getEventSummary(event) }}
                  </div>
                  <div class="event-details" v-if="event.payload">
                    <span class="detail-badge" v-for="key in Object.keys(event.payload).slice(0, 3)" :key="key">
                      {{ key }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">📡</div>
          <h3>Waiting for Claude Code Sessions...</h3>
          <p>The dashboard will automatically populate when Claude Code sessions become active.</p>
          <div class="connection-help">
            <p>Make sure:</p>
            <ul>
              <li>Claude Code is running with hooks enabled</li>
              <li>WebSocket server is running on port 4000</li>
              <li>Hook events are being generated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Detail Modal -->
    <div v-if="selectedEvent" class="modal-overlay" @click="selectedEvent = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedEvent.hook_event_type }}</h3>
          <button @click="selectedEvent = null" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="event-detail-section">
            <h4>Session Information</h4>
            <p><strong>Session ID:</strong> {{ selectedEvent.session_id }}</p>
            <p><strong>Source App:</strong> {{ selectedEvent.source_app }}</p>
            <p><strong>PST Time:</strong> {{ formatDetailedPSTTime(selectedEvent.timestamp) }}</p>
            <p><strong>Relative Time:</strong> {{ formatRelativeTime(selectedEvent.timestamp) }}</p>
          </div>
          
          <div class="event-detail-section" v-if="selectedEvent.payload">
            <h4>Payload</h4>
            <pre class="payload-content">{{ JSON.stringify(selectedEvent.payload, null, 2) }}</pre>
          </div>
          
          <div class="event-detail-section" v-if="selectedEvent.chat">
            <h4>Chat Data</h4>
            <div class="chat-preview">
              {{ selectedEvent.chat.length }} messages
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useWebSocket } from '../../composables/useWebSocket';
import type { HookEvent } from '../../types';

// WebSocket connection
const { events, isConnected, error } = useWebSocket('ws://localhost:4000/stream');

// Component state
const selectedEvent = ref<HookEvent | null>(null);
const sessionData = ref<Map<string, any>>(new Map());
const eventCounter = ref(0);
const lastMinuteEvents = ref<number[]>([]);
const currentTime = ref(Date.now());
const timelineUpdateInterval = ref<number | null>(null);
const isTimelineCollapsed = ref(false);

// Global icon call tracking
const iconCallCount = ref(0);
const clipboardIconCalls = ref(0);

// Session columns computed from actual hook data
const sessionColumns = computed(() => {
  const sessions = new Map<string, any>();
  
  // Group events by session_id
  events.value.forEach(event => {
    // Ensure event has a valid timestamp
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }
    
    if (!sessions.has(event.session_id)) {
      sessions.set(event.session_id, {
        sessionId: event.session_id,
        sessionName: generateSessionName(event.session_id, event.source_app),
        sourceApp: event.source_app,
        events: [],
        lastActivity: event.timestamp,
        isActive: false
      });
    }
    
    const session = sessions.get(event.session_id);
    session.events.push(event);
    session.lastActivity = Math.max(session.lastActivity || 0, event.timestamp || 0);
    
    // Mark as active if had activity in last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    session.isActive = session.lastActivity > fiveMinutesAgo;
  });
  
  // Sort events within each session by timestamp (newest first)
  Array.from(sessions.values()).forEach(session => {
    session.events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  });
  
  // Convert to array and sort by last activity
  return Array.from(sessions.values()).sort((a, b) => b.lastActivity - a.lastActivity);
});

// Statistics
const totalEvents = computed(() => events.value.length);

const eventsPerMinute = computed(() => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const recentEvents = events.value.filter(event => 
    event.timestamp && event.timestamp > oneMinuteAgo
  );
  return recentEvents.length;
});

// Timeline computed properties with throttling for performance
const timeLabels = computed(() => {
  const labels = [];
  const now = currentTime.value;
  const intervals = 5; // 5 time labels
  const minuteInterval = 2; // Every 2 minutes for 10-minute range
  
  for (let i = 0; i <= intervals; i++) {
    const time = now - (i * minuteInterval * 60000); // Each label is 2 minutes apart
    labels.push({
      position: (1 - (i / intervals)) * 100,
      pst: formatPSTTime(time),
      relative: i === 0 ? 'Now' : `${i * minuteInterval}m ago`
    });
  }
  
  return labels;
});

// Throttled timeline position calculation for performance
const throttledCurrentTime = computed(() => {
  // Update position calculations only every ~100ms for ultra-smooth movement
  const timeStep = 100; // milliseconds
  return Math.floor(currentTime.value / timeStep) * timeStep;
});

const getTimelineEvents = (session: any) => {
  const now = currentTime.value;
  const timeRange = 10 * 60000; // Expand to 10 minutes for better spread
  const timeRangeAgo = now - timeRange;
  
  // Reduced logging for performance - only log when debugging
  const debug = false; // Set to true when debugging timeline issues
  
  if (debug) {
    console.group(`🔍 getTimelineEvents Debug for session: ${session.sessionId}`);
    console.log('Session events count:', session.events.length);
  }
  
  // Show events from the last 10 minutes, or if none, show last 15 events
  const recentEvents = session.events.filter((event: any) => 
    event.timestamp && event.timestamp > timeRangeAgo
  );
  
  // If no recent events, show the last 15 events regardless of age
  let eventsToShow = recentEvents.length > 0 ? recentEvents : session.events.slice(0, 15);
  
  // Ensure each event has a valid hook_event_type
  const processedEvents = eventsToShow.map((event: any, index: number) => {
    const originalType = event.hook_event_type;
    
    // Don't mutate the original event - create a new one
    const processedEvent = Object.freeze({
      ...event,
      hook_event_type: event.hook_event_type || 'pre_tool_use', // Fallback to prevent undefined
      timestamp: event.timestamp || Date.now()
    });
    
    if (originalType !== processedEvent.hook_event_type && debug) {
      console.warn(`⚠️ Event ${index} had invalid hook_event_type:`, originalType, '-> fixed to:', processedEvent.hook_event_type);
    }
    
    return processedEvent;
  });
  
  if (debug) {
    console.log('Processed events count:', processedEvents.length);
    console.groupEnd();
  }
  return processedEvents;
};

const getTimelinePosition = (event: any) => {
  const now = throttledCurrentTime.value; // Use throttled time for smoother movement
  const timeRange = 10 * 60000; // 10 minutes range
  const timeRangeAgo = now - timeRange;
  const eventAge = now - event.timestamp;
  
  // Debug logging
  if (Math.random() < 0.1) { // Log 10% of calls
    console.log('🔍 Position Debug:', {
      eventId: event.id,
      now: new Date(now).toLocaleTimeString(),
      eventTime: new Date(event.timestamp).toLocaleTimeString(),
      eventAge: Math.round(eventAge / 60000) + 'm',
      timeRangeAgo: new Date(timeRangeAgo).toLocaleTimeString(),
      withinRange: event.timestamp >= timeRangeAgo
    });
  }
  
  // Calculate position based on timestamp relative to the time range
  let position;
  
  if (event.timestamp >= timeRangeAgo) {
    // Event is within the time range - calculate normal position
    position = ((event.timestamp - timeRangeAgo) / timeRange) * 100;
    if (Math.random() < 0.1) {
      console.log('✅ Within range position:', position);
    }
  } else {
    // Event is older than time range - distribute older events across the left 20%
    const index = event.index || 0;
    position = (index / 15) * 20; // Spread across first 20% of timeline
    if (Math.random() < 0.1) {
      console.log('⚠️ Older event position:', position, 'index:', index);
    }
  }
  
  const clampedPosition = Math.max(0, Math.min(100, position));
  
  return {
    left: `${clampedPosition}%`,
    opacity: eventAge > timeRange ? '0.7' : '1', // Slightly fade older events
    transition: 'left 1s ease-out' // Smooth movement
  };
};

// Methods
const generateSessionName = (sessionId: string, sourceApp: string) => {
  const prefix = sourceApp === 'claude-code' ? 'Claude Code' : sourceApp;
  const suffix = sessionId.substring(0, 8);
  return `${prefix} ${suffix}`;
};

const getSessionIcon = (session: any) => {
  if (session.sourceApp === 'claude-code') return '🤖';
  if (session.sourceApp === 'claude-desktop') return '💻';
  return '⚡';
};

const getSessionIconClass = (session: any) => {
  return {
    'claude-code': session.sourceApp === 'claude-code',
    'claude-desktop': session.sourceApp === 'claude-desktop',
    'active': session.isActive
  };
};

const getEventIcon = (eventType: string) => {
  // Track all icon calls
  iconCallCount.value++;
  
  const icons = {
    // Snake case (original format)
    'pre_tool_use': '🔧',
    'post_tool_use': '✅',
    'chat': '💬',
    'stop': '⏹️',
    'notification': '🔔',
    'subagent_stop': '🤖',
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    // PascalCase variants (new format)
    'PreToolUse': '🔧',
    'PostToolUse': '✅',
    'Chat': '💬',
    'Stop': '⏹️',
    'Notification': '🔔',
    'SubagentStop': '🤖',
    'Error': '❌',
    'Warning': '⚠️',
    'Info': 'ℹ️'
  };
  
  // Reduced logging - only log when there's an issue
  if (!eventType || eventType.trim() === '') {
    console.warn('⚠️ getEventIcon: eventType is null/undefined/empty, using default 🔧');
    return '🔧'; // Default to tool icon instead of clipboard
  }
  
  const cleanEventType = eventType.trim();
  const icon = icons[cleanEventType];
  
  if (!icon) {
    console.warn(`⚠️ getEventIcon: Unknown event type "${cleanEventType}" (original: "${eventType}"), using default 🔧`);
    return '🔧'; // Default to tool icon instead of clipboard
  }
  
  // Track if we're somehow returning clipboard icon
  if (icon === '📋') {
    clipboardIconCalls.value++;
    console.error('🚨 CLIPBOARD ICON DETECTED! This should not happen!');
    console.error('Event type:', eventType);
    console.error('Clean event type:', cleanEventType);
    console.error('Icon:', icon);
    console.trace('Stack trace for clipboard icon');
  }
  
  // Only log detailed info if it's the first 10 calls or if there's an issue
  if (iconCallCount.value <= 10 || icon === '📋') {
    console.log(`🔍 getEventIcon #${iconCallCount.value}: "${cleanEventType}" -> "${icon}"`);
  }
  
  return icon;
};

const getEventSummary = (event: HookEvent) => {
  if (event.summary) return event.summary;
  if (event.payload?.tool_name) return `Tool: ${event.payload.tool_name}`;
  if (event.payload?.message) return event.payload.message.substring(0, 50) + '...';
  return event.hook_event_type.replace('_', ' ').toUpperCase();
};

// Remove the old stacking function since we're now using a scrollable list

// Time formatting functions
const formatPSTTime = (timestamp: number) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    timeZone: 'America/Los_Angeles',
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatDetailedPSTTime = (timestamp: number) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatRelativeTime = (timestamp: number) => {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 1000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const selectEvent = (event: HookEvent) => {
  selectedEvent.value = event;
};

const debugEventClick = (event: any, index: number) => {
  console.group(`🔍 Event Click Debug - Index: ${index}`);
  console.log('Full event object:', event);
  console.log('Event ID:', event.id);
  console.log('Event hook_event_type:', event.hook_event_type);
  console.log('Event timestamp:', event.timestamp);
  console.log('Event payload:', event.payload);
  console.log('Event is frozen:', Object.isFrozen(event));
  console.log('Event properties:', Object.keys(event));
  
  // Test icon generation
  const icon = getEventIcon(event.hook_event_type);
  console.log('Generated icon:', icon);
  console.log('Icon is clipboard (📋):', icon === '📋');
  
  console.groupEnd();
};

// Watch for new events and add animation
watch(events, (newEvents, oldEvents) => {
  console.group('🔍 Events Watch Debug');
  console.log('Old events count:', oldEvents.length);
  console.log('New events count:', newEvents.length);
  
  // Check for event data integrity
  if (newEvents.length > 0) {
    console.log('Sample event (first):');
    const sample = newEvents[0];
    console.log('- hook_event_type:', sample.hook_event_type);
    console.log('- is frozen:', Object.isFrozen(sample));
    console.log('- keys:', Object.keys(sample));
    
    // Check if events have been mutated
    const eventsWithMissingTypes = newEvents.filter(e => !e.hook_event_type);
    if (eventsWithMissingTypes.length > 0) {
      console.error('🚨 Found events with missing hook_event_type:', eventsWithMissingTypes.length);
      console.error('Examples:', eventsWithMissingTypes.slice(0, 3));
    }
  }
  
  if (newEvents.length > oldEvents.length) {
    // Mark new events
    const newEventCount = newEvents.length - oldEvents.length;
    console.log('New event count:', newEventCount);
    
    for (let i = 0; i < newEventCount; i++) {
      const event = newEvents[i];
      console.log(`New event ${i}:`, {
        id: event.id,
        hook_event_type: event.hook_event_type,
        timestamp: event.timestamp,
        isFrozen: Object.isFrozen(event)
      });
      
      // Test icon generation immediately
      const icon = getEventIcon(event.hook_event_type);
      console.log(`Icon for new event ${i}:`, icon);
      
      // Don't mutate frozen events - this was causing recursive updates
      // event.isNew = true;
      
      // Remove the 'new' flag after animation
      // setTimeout(() => {
      //   event.isNew = false;
      // }, 2000);
    }
  }
  
  console.groupEnd();
}, { deep: true });

// Save collapse state to localStorage
watch(isTimelineCollapsed, (newValue) => {
  localStorage.setItem('timeline-collapsed', String(newValue));
});

// Debug watcher for sessionColumns
watch(sessionColumns, (newCols, oldCols) => {
  console.group('🔍 Session Columns Watch Debug');
  console.log('Old columns count:', oldCols.length);
  console.log('New columns count:', newCols.length);
  
  newCols.forEach((col, idx) => {
    console.log(`Session ${idx}:`, {
      id: col.sessionId,
      eventCount: col.events.length,
      firstEventType: col.events[0]?.hook_event_type,
      hasUndefinedTypes: col.events.some(e => !e.hook_event_type)
    });
  });
  
  console.groupEnd();
}, { deep: true });

// Generate mock data for testing when no server is available
const generateMockData = () => {
  const mockEvents = [];
  const sessionIds = ['session-cc-1', 'session-cc-2', 'session-cc-3', 'session-cd-1'];
  const eventTypes = ['pre_tool_use', 'post_tool_use', 'chat', 'notification', 'stop'];
  const sourceApps = ['claude-code', 'claude-desktop'];
  const toolNames = ['Edit', 'Read', 'Bash', 'Write', 'Search'];
  
  // Generate more events with better distribution
  for (let sessionIdx = 0; sessionIdx < sessionIds.length; sessionIdx++) {
    const sessionId = sessionIds[sessionIdx];
    const sourceApp = sessionIdx < 3 ? 'claude-code' : 'claude-desktop';
    const eventCount = 5; // Fewer events for clearer visualization
    
    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      // Create events spread evenly across the timeline
      const timeOffset = (i / eventCount) * 600000; // Evenly distributed from 0-10 minutes
      
      mockEvents.push(Object.freeze({
        id: `${sessionId}-${i}`,
        session_id: sessionId,
        source_app: sourceApp,
        hook_event_type: eventType,
        timestamp: Date.now() - timeOffset,
        payload: Object.freeze({
          tool_name: eventType === 'pre_tool_use' ? toolNames[Math.floor(Math.random() * toolNames.length)] : undefined,
          message: `${eventType} event in ${sessionId}`,
          duration: Math.floor(Math.random() * 5000),
          status: eventType === 'post_tool_use' ? 'success' : undefined
        }),
        summary: `${eventType.replace(/_/g, ' ')} - ${sourceApp} session`,
        isNew: false
      }));
    }
  }
  
  // Sort by timestamp (newest first)
  return mockEvents.sort((a, b) => b.timestamp - a.timestamp);
};

// Track events per minute and update timeline
onMounted(() => {
  // Restore collapse state from localStorage
  const savedCollapseState = localStorage.getItem('timeline-collapsed');
  if (savedCollapseState !== null) {
    isTimelineCollapsed.value = savedCollapseState === 'true';
  }
  
  // Add mock data if no real events are available
  if (events.value.length === 0) {
    const mockEvents = generateMockData();
    events.value.push(...mockEvents);
  }
  
  // Use requestAnimationFrame for ultra-smooth timeline updates
  let lastFrameTime = performance.now();
  const animateTimeline = (currentFrameTime: number) => {
    // Calculate delta time for consistent movement
    const deltaTime = currentFrameTime - lastFrameTime;
    
    // Update only if enough time has passed (60fps = ~16.67ms per frame)
    if (deltaTime >= 16) {
      currentTime.value = Date.now();
      lastFrameTime = currentFrameTime;
    }
    
    // Continue animation loop
    if (timelineUpdateInterval.value !== null) {
      timelineUpdateInterval.value = requestAnimationFrame(animateTimeline);
    }
  };
  
  // Start the animation loop
  timelineUpdateInterval.value = requestAnimationFrame(animateTimeline);
  
  // Add new mock event occasionally for testing (remove this in production)
  setInterval(() => {
    if (Math.random() < 0.3) { // 30% chance every 5 seconds for better visibility
      const sessionIds = ['session-cc-1', 'session-cc-2', 'session-cc-3', 'session-cd-1'];
      const eventTypes = ['pre_tool_use', 'post_tool_use', 'chat', 'notification', 'stop'];
      const toolNames = ['Edit', 'Read', 'Bash', 'Write', 'Search'];
      
      const sessionId = sessionIds[Math.floor(Math.random() * sessionIds.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const newEvent = Object.freeze({
        id: `mock-${Date.now()}-${Math.random()}`,
        session_id: sessionId,
        source_app: sessionId.includes('cc') ? 'claude-code' : 'claude-desktop',
        hook_event_type: eventType,
        timestamp: Date.now(),
        payload: Object.freeze({
          tool_name: eventType === 'pre_tool_use' ? toolNames[Math.floor(Math.random() * toolNames.length)] : undefined,
          message: `Real-time ${eventType} event`,
          status: eventType === 'post_tool_use' ? 'success' : undefined
        }),
        summary: `Real-time ${eventType.replace(/_/g, ' ')} event`,
        isNew: true
      });
      
      events.value.unshift(newEvent);
      
      // Don't mutate frozen object - was causing recursive updates
      // setTimeout(() => {
      //   newEvent.isNew = false;
      // }, 2000);
    }
  }, 5000); // Every 5 seconds for mock events
  
  // Track events per minute
  setInterval(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentEvents = events.value.filter(event => 
      event.timestamp && event.timestamp > oneMinuteAgo
    );
    lastMinuteEvents.value.push(recentEvents.length);
    
    // Keep only last 5 minutes of data
    if (lastMinuteEvents.value.length > 5) {
      lastMinuteEvents.value.shift();
    }
  }, 60000); // Update every minute
});

// Cleanup interval on unmount
onUnmounted(() => {
  if (timelineUpdateInterval.value) {
    cancelAnimationFrame(timelineUpdateInterval.value);
    timelineUpdateInterval.value = null;
  }
});
</script>

<style scoped>
.dashboard-realtime {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  overflow-x: hidden;
}

/* Header */
.dashboard-header {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
}

/* Logo Stream Timeline Section */
.logo-stream-section {
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem;
  position: sticky;
  top: 0;
  z-index: 999;
}

.timeline-container {
  max-width: 1400px;
  margin: 0 auto;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.timeline-title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.collapse-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.collapse-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.collapse-icon {
  color: #fbbf24;
  font-size: 0.875rem;
  font-weight: bold;
  transition: transform 0.2s ease;
}

.timeline-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #fbbf24;
}

.timeline-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.debug-info {
  display: flex;
  gap: 0.5rem;
}

.debug-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.debug-badge.error {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

.timeline-range {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

/* Timeline Collapse Animation */
.timeline-content {
  overflow: hidden;
}

.timeline-collapse-enter-active,
.timeline-collapse-leave-active {
  transition: all 0.3s ease;
}

.timeline-collapse-enter-from,
.timeline-collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.timeline-collapse-enter-to,
.timeline-collapse-leave-from {
  opacity: 1;
  max-height: 300px;
}

/* Time Labels */
.timeline-labels {
  position: relative;
  height: 40px;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.time-label {
  position: absolute;
  transform: translateX(-50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-label::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 10px;
  background: rgba(255, 255, 255, 0.3);
}

.time-pst {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fbbf24;
  font-family: monospace;
}

.time-relative {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Session Rows */
.session-rows {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 40px;
}

.session-label {
  min-width: 180px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
}

.session-icon-small {
  font-size: 1.25rem;
}

.session-name-container {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.session-name-full {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fbbf24;
}

.session-id-small {
  font-family: monospace;
  font-size: 0.75rem;
  opacity: 0.8;
}

.timeline-track {
  flex: 1;
  height: 100%;
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  overflow: hidden;
  
  /* Performance optimizations for smooth animations */
  will-change: scroll-position;
  contain: layout style paint;
  transform: translateZ(0); /* Force GPU layer */
}

.timeline-event {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: left 1s ease-out, transform 0.3s ease, box-shadow 0.3s ease;
  animation: eventPulse 2s infinite;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  
  /* Performance optimizations for ultra-smooth movement */
  will-change: left, transform;
  contain: layout style paint;
  backface-visibility: hidden;
  perspective: 1000px;
  transform-style: preserve-3d;
}

@keyframes eventPulse {
  0% { transform: translateY(-50%) scale(1); }
  50% { transform: translateY(-50%) scale(1.1); }
  100% { transform: translateY(-50%) scale(1); }
}

.timeline-event:hover {
  transform: translateY(-50%) scale(1.2);
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.event-icon-small {
  font-size: 1rem;
}

/* Timeline event type colors */
.timeline-event.event-pre_tool_use {
  background: #fbbf24;
}

.timeline-event.event-post_tool_use {
  background: #10b981;
}

.timeline-event.event-chat {
  background: #8b5cf6;
}

.timeline-event.event-stop {
  background: #ef4444;
}

.timeline-event.event-notification {
  background: #3b82f6;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.connection-status {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
}

.connection-status.connected {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.connection-status.disconnected {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.header-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  opacity: 0.8;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fbbf24;
}

/* Main Dashboard */
.dashboard-main {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.session-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  align-items: start;
}

.session-column {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.3s ease;
}

.session-column.active {
  border-color: #10b981;
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
}

.session-column:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* Session Header */
.session-header {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.session-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.session-icon.active {
  background: rgba(16, 185, 129, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.session-details h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.session-id {
  margin: 0 0 0.25rem 0;
  font-size: 0.75rem;
  opacity: 0.7;
  font-family: monospace;
}

.session-stats {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.8;
}

.session-activity {
  text-align: right;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.activity-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse-dot 1s infinite;
}

@keyframes pulse-dot {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.time-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.last-activity-pst {
  font-size: 0.875rem;
  color: #fbbf24;
  font-weight: 600;
  font-family: monospace;
}

.last-activity-relative {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Event Stack */
.event-stack {
  padding: 1.5rem;
  height: 500px;
  position: relative;
}

.events-scroll-container {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 0.5rem;
}

.event-card {
  background: rgba(255, 255, 255, 0.95);
  color: #1f2937;
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  min-height: 120px;
}

.event-card:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.event-card.new-event {
  animation: cardAppear 0.5s ease-out;
}

@keyframes cardAppear {
  0% {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.event-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.event-icon {
  font-size: 1.25rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-type {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
}

.event-time {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.time-pst {
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 600;
  font-family: monospace;
}

.time-relative {
  font-size: 0.75rem;
  color: #6b7280;
  opacity: 0.8;
}

.event-content {
  margin-left: 40px;
}

.event-summary {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.event-details {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.detail-badge {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Event type specific colors */
.event-card.event-pre_tool_use .event-icon {
  background: rgba(251, 191, 36, 0.2);
}

.event-card.event-post_tool_use .event-icon {
  background: rgba(16, 185, 129, 0.2);
}

.event-card.event-chat .event-icon {
  background: rgba(139, 92, 246, 0.2);
}

.event-card.event-stop .event-icon {
  background: rgba(239, 68, 68, 0.2);
}

.event-card.event-notification .event-icon {
  background: rgba(59, 130, 246, 0.2);
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.empty-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 500px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-content p {
  margin: 0 0 2rem 0;
  opacity: 0.8;
}

.connection-help {
  text-align: left;
  background: rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-top: 2rem;
}

.connection-help ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.connection-help li {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  color: #1f2937;
  border-radius: 1rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.event-detail-section {
  margin-bottom: 1.5rem;
}

.event-detail-section h4 {
  margin: 0 0 0.75rem 0;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.event-detail-section p {
  margin: 0.5rem 0;
  color: #4b5563;
}

.payload-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
  max-height: 300px;
  color: #1f2937;
}

.chat-preview {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  color: #4b5563;
  text-align: center;
  font-style: italic;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-stats {
    gap: 1rem;
  }
  
  .logo-stream-section {
    padding: 1rem;
  }
  
  .timeline-header {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .timeline-title-section {
    justify-content: center;
  }
  
  .timeline-header h2 {
    font-size: 1rem;
  }
  
  .collapse-button {
    width: 28px;
    height: 28px;
    padding: 0.25rem;
  }
  
  .session-label {
    min-width: 100px;
  }
  
  .session-name-full {
    font-size: 0.75rem;
  }
  
  .session-id-small {
    display: none;
  }
  
  .timeline-event {
    width: 24px;
    height: 24px;
  }
  
  .event-icon-small {
    font-size: 0.875rem;
  }
  
  .time-label {
    font-size: 0.75rem;
  }
  
  .dashboard-main {
    padding: 1rem;
  }
  
  .session-columns {
    grid-template-columns: 1fr;
  }
  
  .session-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .session-info {
    flex-direction: column;
    text-align: center;
  }
  
  .modal-content {
    width: 95%;
  }
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Event Cards Scrollbar */
.events-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.events-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.events-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.events-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
</style>