# Job Specification: Dashboard Layout Redesign

## Job ID: LAYOUT-001
## Priority: High
## Estimated Duration: 4-5 days

## Objective
Redesign the dashboard with a multi-section layout featuring logo visualization rows, command/action sections, and expandable log areas with enhanced visual hierarchy and usability.

## Prerequisites
- React 18+ with TypeScript
- Existing dashboard components
- WebSocket data stream
- Design system tokens

## Deliverables

### 1. Layout Architecture
```typescript
// Location: apps/client/src/components/Dashboard/DashboardLayout.tsx
interface DashboardLayout {
  header: HeaderSection;
  sections: {
    logoVisualization: LogoSection;
    commandCenter: CommandSection;
    logsMetrics: LogsSection;
  };
  sidebar?: SidebarSection;
  footer?: FooterSection;
}

// Responsive breakpoints
const breakpoints = {
  mobile: '0-768px',
  tablet: '769-1024px',
  desktop: '1025-1440px',
  widescreen: '1441px+'
};
```

### 2. Logo Visualization Section
```typescript
// Location: apps/client/src/components/Dashboard/sections/LogoVisualization/
interface LogoVisualizationSection {
  layout: 'grid' | 'flex' | 'masonry';
  rows: AgentLogoRow[];
  
  features: {
    autoArrange: boolean;
    connectionVisualization: boolean;
    realTimeUpdates: boolean;
    zoomControls: boolean;
  };
}

// Agent Logo Row Component
interface AgentLogoRow {
  agent: {
    id: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
  };
  
  visualization: {
    logo: AnimatedSVG;
    statusRing: StatusIndicator;
    activityPulse: PulseEffect;
    metrics: MiniMetrics;
  };
  
  interactions: {
    onClick: () => void;
    onHover: () => void;
    onDragStart: () => void;
  };
}
```

### 3. Command Center Section
```typescript
// Location: apps/client/src/components/Dashboard/sections/CommandCenter/
interface CommandCenterSection {
  view: 'table' | 'cards' | 'timeline';
  
  tabs: {
    active: {
      commands: Command[];
      refreshRate: number;
    };
    queued: {
      commands: Command[];
      estimatedTime: number;
    };
    completed: {
      commands: Command[];
      pagination: PaginationConfig;
    };
    failed: {
      commands: Command[];
      errorDetails: boolean;
    };
  };
  
  features: {
    search: SearchConfig;
    filters: FilterConfig;
    sort: SortConfig;
    bulkActions: BulkActionConfig;
  };
}

// Command Row Component
interface CommandRow {
  command: {
    id: string;
    type: CommandType;
    agent: string;
    timestamp: Date;
    duration?: number;
    status: CommandStatus;
  };
  
  display: {
    compact: CompactView;
    expanded: ExpandedView;
    preview: PreviewTooltip;
  };
  
  actions: {
    retry?: () => void;
    cancel?: () => void;
    viewDetails: () => void;
    export: () => void;
  };
}
```

### 4. Logs & Metrics Section
```typescript
// Location: apps/client/src/components/Dashboard/sections/LogsMetrics/
interface LogsMetricsSection {
  layout: 'accordion' | 'tabs' | 'split';
  
  categories: {
    systemLogs: {
      entries: LogEntry[];
      severity: SeverityFilter;
      tail: boolean;
    };
    performance: {
      metrics: PerformanceMetric[];
      charts: ChartConfig[];
      aggregation: AggregationPeriod;
    };
    errors: {
      entries: ErrorEntry[];
      grouping: GroupingStrategy;
      analysis: ErrorAnalysis;
    };
    audit: {
      entries: AuditEntry[];
      compliance: ComplianceFlags;
      export: ExportOptions;
    };
  };
}
```

### 5. Visual Components

#### Status Indicators
```typescript
// Location: apps/client/src/components/Dashboard/components/StatusIndicators/
interface StatusIndicatorSet {
  // Traffic light style
  trafficLight: {
    green: 'operational';
    yellow: 'warning';
    red: 'error';
    blue: 'maintenance';
  };
  
  // Animated rings
  statusRing: {
    animation: 'pulse' | 'rotate' | 'breathe';
    color: string;
    thickness: number;
  };
  
  // Progress indicators
  progress: {
    type: 'linear' | 'circular' | 'stepped';
    value: number;
    showPercentage: boolean;
  };
}
```

#### Connection Visualizations
```typescript
// Location: apps/client/src/components/Dashboard/components/Connections/
interface ConnectionVisualization {
  // Connection lines between agents
  lines: {
    type: 'bezier' | 'straight' | 'orthogonal';
    style: 'solid' | 'dashed' | 'animated';
    thickness: 'fixed' | 'traffic-based';
    color: 'status-based' | 'type-based' | 'custom';
  };
  
  // Data flow animation
  flowAnimation: {
    particles: boolean;
    speed: number;
    density: number;
    direction: 'bidirectional' | 'source-to-target';
  };
  
  // Interaction zones
  interactionZones: {
    hover: HoverEffect;
    click: ClickAction;
    tooltip: TooltipContent;
  };
}
```

## Implementation Requirements

### Component Architecture
```
components/Dashboard/
├── DashboardLayout.tsx
├── DashboardProvider.tsx
├── sections/
│   ├── LogoVisualization/
│   │   ├── LogoSection.tsx
│   │   ├── AgentLogoRow.tsx
│   │   ├── LogoAnimations.tsx
│   │   └── ConnectionOverlay.tsx
│   ├── CommandCenter/
│   │   ├── CommandSection.tsx
│   │   ├── CommandTable.tsx
│   │   ├── CommandCard.tsx
│   │   └── CommandFilters.tsx
│   └── LogsMetrics/
│       ├── LogsSection.tsx
│       ├── LogViewer.tsx
│       ├── MetricsDisplay.tsx
│       └── ErrorAnalyzer.tsx
├── components/
│   ├── StatusIndicators/
│   ├── Connections/
│   ├── Charts/
│   └── Controls/
└── hooks/
    ├── useDashboardLayout.ts
    ├── useAgentConnections.ts
    └── useRealTimeUpdates.ts
```

### State Management
```typescript
// Zustand store for dashboard state
interface DashboardStore {
  // Layout state
  layout: {
    sections: SectionConfig[];
    collapsed: string[];
    order: string[];
  };
  
  // View preferences
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    density: 'compact' | 'comfortable' | 'spacious';
    animations: boolean;
  };
  
  // Data state
  agents: Map<string, AgentState>;
  commands: Map<string, Command>;
  logs: LogEntry[];
  
  // Actions
  actions: {
    updateLayout: (config: LayoutConfig) => void;
    toggleSection: (sectionId: string) => void;
    reorderSections: (order: string[]) => void;
    updateAgentState: (agentId: string, state: AgentState) => void;
  };
}
```

### Styling System
```scss
// Location: apps/client/src/styles/dashboard/
// Design tokens
$spacing: (
  xs: 4px,
  sm: 8px,
  md: 16px,
  lg: 24px,
  xl: 32px
);

$colors: (
  status: (
    success: #10B981,
    warning: #F59E0B,
    error: #EF4444,
    info: #3B82F6
  ),
  agent: (
    active: #22C55E,
    idle: #6B7280,
    processing: #3B82F6,
    error: #EF4444
  )
);

// Grid system
.dashboard-grid {
  display: grid;
  grid-template-areas:
    "logo logo logo"
    "command command sidebar"
    "logs logs sidebar";
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    grid-template-areas:
      "logo"
      "command"
      "logs";
  }
}
```

## Implementation Steps

1. **Day 1: Layout Foundation**
   - Create dashboard layout structure
   - Implement responsive grid system
   - Set up section containers
   - Configure state management

2. **Day 2: Logo Visualization**
   - Build agent logo row components
   - Implement SVG animations
   - Create connection overlay system
   - Add interaction handlers

3. **Day 3: Command Center**
   - Develop command table/card views
   - Implement filtering system
   - Create tab navigation
   - Add bulk actions

4. **Day 4: Logs & Metrics**
   - Build log viewer component
   - Create metrics displays
   - Implement expandable sections
   - Add search functionality

5. **Day 5: Integration & Polish**
   - Connect to WebSocket data
   - Implement real-time updates
   - Add animations and transitions
   - Performance optimization

## Testing Requirements

### Component Tests
```typescript
describe('DashboardLayout', () => {
  it('renders all sections correctly');
  it('handles responsive breakpoints');
  it('maintains layout state');
  it('updates on real-time data');
});

describe('AgentLogoRow', () => {
  it('displays agent status correctly');
  it('animates on state changes');
  it('shows connections to other agents');
  it('handles interaction events');
});
```

### Visual Regression Tests
- Screenshot comparisons at each breakpoint
- Animation frame validation
- Theme consistency checks
- Accessibility compliance

### Performance Tests
- Initial render < 100ms
- Smooth animations at 60fps
- Efficient re-renders on updates
- Memory usage optimization

## Success Criteria

1. All sections implemented and functional
2. Responsive design works on all devices
3. Real-time updates without flicker
4. Accessibility score > 95
5. Performance metrics met
6. User testing approval

## Dependencies
- React 18+
- TypeScript 5+
- Framer Motion (animations)
- D3.js (visualizations)
- Zustand (state management)
- CSS Grid/Flexbox

## Risks & Mitigations
- **Risk**: Performance with many agents
  - **Mitigation**: Virtual scrolling and lazy loading
- **Risk**: Complex animations affecting performance
  - **Mitigation**: GPU acceleration and reduced motion options
- **Risk**: Data overload in UI
  - **Mitigation**: Progressive disclosure and filtering