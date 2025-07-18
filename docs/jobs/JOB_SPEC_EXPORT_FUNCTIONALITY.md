# Job Specification: Data Export Functionality

## Job ID: EXPORT-001
## Priority: High
## Estimated Duration: 3-4 days

## Objective
Implement comprehensive data export functionality supporting multiple formats (JSON, CSV, Parquet, Excel), with filtering, aggregation, and scheduling capabilities.

## Prerequisites
- Access to dashboard data stores
- File system write permissions
- Worker thread support for large exports
- S3/cloud storage credentials (optional)

## Deliverables

### 1. Export Service Architecture
```typescript
// Location: apps/client/src/services/ExportService.ts
interface ExportService {
  // Core export methods
  exportData(config: ExportConfig): Promise<ExportResult>;
  streamExport(config: ExportConfig): ReadableStream;
  scheduleExport(config: ScheduledExportConfig): Promise<string>;
  
  // Template management
  saveTemplate(name: string, config: ExportConfig): Promise<void>;
  loadTemplate(name: string): Promise<ExportConfig>;
  listTemplates(): Promise<ExportTemplate[]>;
  
  // Export history
  getExportHistory(): Promise<ExportHistoryEntry[]>;
  getExportStatus(exportId: string): Promise<ExportStatus>;
  cancelExport(exportId: string): Promise<void>;
}
```

### 2. Format Implementations

#### JSON Exporter
```typescript
// Location: apps/client/src/services/exporters/JsonExporter.ts
interface JsonExporter {
  export(data: any[], options: JsonExportOptions): Promise<Buffer>;
  
  options: {
    structure: 'flat' | 'nested' | 'normalized';
    prettyPrint: boolean;
    includeMetadata: boolean;
    compression: 'none' | 'gzip' | 'brotli';
    
    // Data transformations
    dateFormat: 'iso' | 'unix' | 'custom';
    nullHandling: 'include' | 'exclude' | 'empty';
    arrayHandling: 'expand' | 'stringify';
  };
  
  // Streaming support for large datasets
  createStream(options: JsonExportOptions): Transform;
}

// Example output structures
// Flat structure
{
  "records": [
    {"id": 1, "agent": "agent-1", "command": "test", "status": "success"}
  ]
}

// Nested structure
{
  "agents": {
    "agent-1": {
      "commands": [...]
    }
  }
}

// Normalized structure
{
  "agents": {...},
  "commands": {...},
  "relationships": {...}
}
```

#### CSV Exporter
```typescript
// Location: apps/client/src/services/exporters/CsvExporter.ts
interface CsvExporter {
  export(data: any[], options: CsvExportOptions): Promise<Buffer>;
  
  options: {
    delimiter: ',' | ';' | '\t' | '|';
    headers: boolean | string[];
    quotes: 'all' | 'minimal' | 'none';
    escape: string;
    lineTerminator: '\n' | '\r\n';
    encoding: 'utf-8' | 'utf-16' | 'ascii';
    
    // Column configuration
    columns: {
      include?: string[];
      exclude?: string[];
      rename?: Record<string, string>;
      order?: string[];
    };
    
    // Data formatting
    dateFormat: string; // moment.js format
    numberFormat: {
      decimals: number;
      separator: string;
      thousandsSeparator: string;
    };
  };
  
  // Pivot table support
  pivot(data: any[], options: PivotOptions): Promise<Buffer>;
}
```

#### Parquet Exporter
```typescript
// Location: apps/client/src/services/exporters/ParquetExporter.ts
interface ParquetExporter {
  export(data: any[], options: ParquetExportOptions): Promise<Buffer>;
  
  options: {
    compression: 'snappy' | 'gzip' | 'lzo' | 'brotli' | 'lz4' | 'zstd';
    rowGroupSize: number; // Default: 5000
    pageSize: number; // Default: 1024 * 1024
    
    // Schema definition
    schema: {
      fields: ParquetField[];
      metadata?: Record<string, string>;
    };
    
    // Partitioning
    partitionBy?: string[];
    partitionValues?: Record<string, any>;
  };
  
  // Efficient columnar storage
  writePartitioned(
    data: any[],
    partitionKey: string,
    options: ParquetExportOptions
  ): Promise<void>;
}
```

#### Excel Exporter
```typescript
// Location: apps/client/src/services/exporters/ExcelExporter.ts
interface ExcelExporter {
  export(data: ExportData, options: ExcelExportOptions): Promise<Buffer>;
  
  options: {
    // Workbook configuration
    workbook: {
      author?: string;
      created?: Date;
      properties?: WorkbookProperties;
    };
    
    // Sheet configuration
    sheets: {
      name: string;
      data: any[];
      columns?: ColumnConfig[];
      styling?: SheetStyling;
      charts?: ChartConfig[];
      pivotTables?: PivotConfig[];
    }[];
    
    // Styling options
    styling: {
      headerStyle?: CellStyle;
      dataStyle?: CellStyle;
      alternatingRows?: boolean;
      borders?: boolean;
      autoFilter?: boolean;
      freezePanes?: FreezeConfig;
    };
    
    // Advanced features
    formulas?: FormulaConfig[];
    conditionalFormatting?: ConditionalFormat[];
    dataValidation?: ValidationRule[];
  };
  
  // Template-based export
  exportWithTemplate(
    data: any[],
    templatePath: string
  ): Promise<Buffer>;
}
```

### 3. Export Configuration UI
```typescript
// Location: apps/client/src/components/Export/ExportDialog.tsx
interface ExportDialog {
  // Step 1: Format selection
  formatSelector: {
    formats: ExportFormat[];
    recommended: ExportFormat;
    onChange: (format: ExportFormat) => void;
  };
  
  // Step 2: Data selection
  dataSelector: {
    dataTypes: DataType[];
    timeRange: TimeRangeSelector;
    filters: FilterBuilder;
    preview: DataPreview;
  };
  
  // Step 3: Format options
  formatOptions: {
    json?: JsonOptionsPanel;
    csv?: CsvOptionsPanel;
    parquet?: ParquetOptionsPanel;
    excel?: ExcelOptionsPanel;
  };
  
  // Step 4: Delivery options
  deliveryOptions: {
    immediate: {
      download: boolean;
      email?: string;
      cloudUpload?: CloudDestination;
    };
    scheduled: {
      frequency: ScheduleFrequency;
      time: TimeSelector;
      destination: ExportDestination;
    };
  };
}
```

### 4. Filtering and Aggregation
```typescript
// Location: apps/client/src/services/export/FilteringService.ts
interface FilteringService {
  // Filter builder
  buildFilter(criteria: FilterCriteria[]): DataFilter;
  
  // Common filters
  filters: {
    timeRange: (start: Date, end: Date) => DataFilter;
    agentIds: (ids: string[]) => DataFilter;
    commandTypes: (types: string[]) => DataFilter;
    status: (statuses: Status[]) => DataFilter;
    custom: (field: string, operator: Operator, value: any) => DataFilter;
  };
  
  // Combine filters
  and(...filters: DataFilter[]): DataFilter;
  or(...filters: DataFilter[]): DataFilter;
  not(filter: DataFilter): DataFilter;
}

// Location: apps/client/src/services/export/AggregationService.ts
interface AggregationService {
  // Aggregation functions
  aggregate(data: any[], config: AggregationConfig): AggregatedData;
  
  // Common aggregations
  aggregations: {
    count: (field?: string) => Aggregation;
    sum: (field: string) => Aggregation;
    avg: (field: string) => Aggregation;
    min: (field: string) => Aggregation;
    max: (field: string) => Aggregation;
    percentile: (field: string, p: number) => Aggregation;
  };
  
  // Grouping
  groupBy(fields: string[]): GroupingConfig;
  
  // Time-based aggregations
  timeBucket(field: string, interval: TimeInterval): TimeBucket;
}
```

### 5. Scheduled Exports
```typescript
// Location: apps/server/src/services/ScheduledExportService.ts
interface ScheduledExportService {
  // Schedule management
  create(config: ScheduledExportConfig): Promise<ScheduledExport>;
  update(id: string, config: Partial<ScheduledExportConfig>): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<ScheduledExport[]>;
  
  // Execution
  executeNow(id: string): Promise<ExportResult>;
  getHistory(id: string): Promise<ExportExecution[]>;
  
  // Destinations
  destinations: {
    email: EmailDestination;
    s3: S3Destination;
    ftp: FtpDestination;
    webhook: WebhookDestination;
    googleDrive: GoogleDriveDestination;
  };
}

// Cron-based scheduling
interface ScheduleConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  customCron?: string;
  timezone: string;
  active: boolean;
  
  // Execution window
  window?: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  
  // Retry policy
  retry: {
    attempts: number;
    backoff: 'linear' | 'exponential';
    maxDelay: number;
  };
}
```

## Implementation Requirements

### Architecture
```
services/
├── ExportService.ts
├── exporters/
│   ├── BaseExporter.ts
│   ├── JsonExporter.ts
│   ├── CsvExporter.ts
│   ├── ParquetExporter.ts
│   └── ExcelExporter.ts
├── export/
│   ├── FilteringService.ts
│   ├── AggregationService.ts
│   ├── CompressionService.ts
│   └── ValidationService.ts
├── scheduled/
│   ├── ScheduledExportService.ts
│   ├── CronScheduler.ts
│   └── DestinationManager.ts
└── workers/
    ├── ExportWorker.ts
    └── StreamingWorker.ts
```

### Performance Optimization
```typescript
// Streaming for large datasets
class StreamingExporter {
  private readonly CHUNK_SIZE = 10000;
  
  async *exportStream(
    dataSource: DataSource,
    exporter: BaseExporter,
    options: ExportOptions
  ): AsyncGenerator<Buffer> {
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const chunk = await dataSource.fetch(offset, this.CHUNK_SIZE);
      if (chunk.length < this.CHUNK_SIZE) {
        hasMore = false;
      }
      
      yield await exporter.exportChunk(chunk, {
        ...options,
        isFirst: offset === 0,
        isLast: !hasMore
      });
      
      offset += chunk.length;
    }
  }
}

// Worker thread for CPU-intensive exports
class ExportWorker {
  private worker: Worker;
  
  constructor() {
    this.worker = new Worker('./exportWorker.js');
  }
  
  async export(data: any[], format: ExportFormat, options: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.worker.postMessage({ data, format, options });
      this.worker.once('message', ({ error, result }) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }
}
```

## Testing Requirements

### Unit Tests
```typescript
describe('JsonExporter', () => {
  it('exports flat structure correctly');
  it('handles nested data');
  it('applies compression when requested');
  it('streams large datasets efficiently');
});

describe('ExcelExporter', () => {
  it('creates multi-sheet workbooks');
  it('applies styling correctly');
  it('generates charts from data');
  it('handles formulas and references');
});
```

### Integration Tests
- Export full dataset workflow
- Scheduled export execution
- Cloud upload verification
- Email delivery confirmation

### Performance Tests
- Export 1M records in < 30s
- Stream exports without memory spikes
- Handle concurrent exports
- Compression efficiency > 70%

## Success Criteria

1. All export formats implemented
2. Filtering and aggregation functional
3. Scheduled exports working reliably
4. UI/UX intuitive and responsive
5. Performance benchmarks met
6. Documentation complete

## Dependencies
- File system access
- Worker threads
- Compression libraries
- Cloud storage SDKs
- Email service
- Cron scheduler

## Risks & Mitigations
- **Risk**: Memory overflow with large exports
  - **Mitigation**: Streaming and chunking
- **Risk**: Export job failures
  - **Mitigation**: Retry mechanism and notifications
- **Risk**: Data consistency during export
  - **Mitigation**: Snapshot isolation and versioning