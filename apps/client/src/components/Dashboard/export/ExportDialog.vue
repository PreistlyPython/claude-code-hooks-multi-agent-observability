<template>
  <div class="export-dialog-overlay" @click="handleOverlayClick">
    <div class="export-dialog" @click.stop>
      <!-- Header -->
      <div class="dialog-header">
        <h2 class="dialog-title">Export Data</h2>
        <button @click="$emit('close')" class="close-button">
          ✕
        </button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Data Sources Selection -->
        <div class="section">
          <h3 class="section-title">Select Data Sources</h3>
          <div class="data-sources-grid">
            <label
              v-for="source in dataSources"
              :key="source.id"
              class="data-source-item"
              :class="{ disabled: source.count === 0 }"
            >
              <input
                type="checkbox"
                v-model="selectedSources"
                :value="source.id"
                :disabled="source.count === 0"
              />
              <div class="source-info">
                <span class="source-name">{{ source.name }}</span>
                <span class="source-count">{{ source.count }} records</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Format Selection -->
        <div class="section">
          <h3 class="section-title">Export Format</h3>
          <div class="format-grid">
            <label
              v-for="format in formats"
              :key="format.id"
              class="format-item"
            >
              <input
                type="radio"
                v-model="selectedFormat"
                :value="format.id"
              />
              <div class="format-info">
                <span class="format-name">{{ format.name }}</span>
                <span class="format-description">{{ format.description }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Format Options -->
        <div v-if="selectedFormat" class="section">
          <h3 class="section-title">Format Options</h3>
          
          <!-- JSON Options -->
          <div v-if="selectedFormat === 'json'" class="options-grid">
            <div class="option-group">
              <label class="option-label">Structure:</label>
              <select v-model="formatOptions.json.structure" class="option-select">
                <option value="flat">Flat</option>
                <option value="nested">Nested</option>
                <option value="normalized">Normalized</option>
              </select>
            </div>
            <div class="option-group">
              <label class="option-label">
                <input
                  type="checkbox"
                  v-model="formatOptions.json.includeMetadata"
                />
                Include Metadata
              </label>
            </div>
            <div class="option-group">
              <label class="option-label">Compression:</label>
              <select v-model="formatOptions.json.compression" class="option-select">
                <option value="none">None</option>
                <option value="gzip">GZIP</option>
                <option value="brotli">Brotli</option>
              </select>
            </div>
          </div>

          <!-- CSV Options -->
          <div v-else-if="selectedFormat === 'csv'" class="options-grid">
            <div class="option-group">
              <label class="option-label">Delimiter:</label>
              <select v-model="formatOptions.csv.delimiter" class="option-select">
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
              </select>
            </div>
            <div class="option-group">
              <label class="option-label">
                <input
                  type="checkbox"
                  v-model="formatOptions.csv.headers"
                />
                Include Headers
              </label>
            </div>
            <div class="option-group">
              <label class="option-label">Encoding:</label>
              <select v-model="formatOptions.csv.encoding" class="option-select">
                <option value="utf-8">UTF-8</option>
                <option value="utf-16">UTF-16</option>
              </select>
            </div>
          </div>

          <!-- Excel Options -->
          <div v-else-if="selectedFormat === 'excel'" class="options-grid">
            <div class="option-group">
              <label class="option-label">Sheets to include:</label>
              <div class="checkbox-group">
                <label><input type="checkbox" v-model="formatOptions.excel.sheets.commands" /> Commands</label>
                <label><input type="checkbox" v-model="formatOptions.excel.sheets.metrics" /> Metrics</label>
                <label><input type="checkbox" v-model="formatOptions.excel.sheets.logs" /> Logs</label>
                <label><input type="checkbox" v-model="formatOptions.excel.sheets.summary" /> Summary</label>
              </div>
            </div>
            <div class="option-group">
              <label class="option-label">
                <input
                  type="checkbox"
                  v-model="formatOptions.excel.styling"
                />
                Apply Styling
              </label>
            </div>
          </div>
        </div>

        <!-- Time Range Filter -->
        <div class="section">
          <h3 class="section-title">Time Range</h3>
          <div class="time-range-controls">
            <label class="time-option">
              <input type="radio" v-model="timeRange" value="last-hour" />
              Last Hour
            </label>
            <label class="time-option">
              <input type="radio" v-model="timeRange" value="last-24h" />
              Last 24 Hours
            </label>
            <label class="time-option">
              <input type="radio" v-model="timeRange" value="last-week" />
              Last Week
            </label>
            <label class="time-option">
              <input type="radio" v-model="timeRange" value="custom" />
              Custom Range
            </label>
          </div>
          
          <div v-if="timeRange === 'custom'" class="custom-range">
            <div class="date-input-group">
              <label>From:</label>
              <input
                type="datetime-local"
                v-model="customTimeRange.start"
                class="date-input"
              />
            </div>
            <div class="date-input-group">
              <label>To:</label>
              <input
                type="datetime-local"
                v-model="customTimeRange.end"
                class="date-input"
              />
            </div>
          </div>
        </div>

        <!-- Export Preview -->
        <div v-if="selectedSources.length > 0" class="section">
          <h3 class="section-title">Export Preview</h3>
          <div class="preview-stats">
            <div class="preview-stat">
              <span class="stat-label">Estimated Size:</span>
              <span class="stat-value">{{ estimatedSize }}</span>
            </div>
            <div class="preview-stat">
              <span class="stat-label">Total Records:</span>
              <span class="stat-value">{{ totalRecords }}</span>
            </div>
            <div class="preview-stat">
              <span class="stat-label">Estimated Time:</span>
              <span class="stat-value">{{ estimatedTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button @click="$emit('close')" class="cancel-button">
          Cancel
        </button>
        <button
          @click="handleExport"
          :disabled="!canExport"
          class="export-button"
          :class="{ loading: isExporting }"
        >
          {{ isExporting ? 'Exporting...' : 'Export Data' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ExportConfiguration } from '../../../types/dashboard.types';

interface DataSource {
  id: string;
  name: string;
  count: number;
}

interface Props {
  dataSources: DataSource[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  export: [config: ExportConfiguration];
  close: [];
}>();

// State
const selectedSources = ref<string[]>([]);
const selectedFormat = ref('json');
const timeRange = ref('last-24h');
const customTimeRange = ref({
  start: '',
  end: ''
});
const isExporting = ref(false);

// Format options
const formatOptions = ref({
  json: {
    structure: 'nested' as 'flat' | 'nested' | 'normalized',
    includeMetadata: true,
    compression: 'none' as 'none' | 'gzip' | 'brotli'
  },
  csv: {
    delimiter: ',' as ',' | ';' | '\t',
    headers: true,
    dateFormat: 'ISO',
    encoding: 'utf-8' as 'utf-8' | 'utf-16'
  },
  excel: {
    sheets: {
      commands: true,
      metrics: true,
      logs: true,
      summary: true
    },
    styling: true
  },
  parquet: {
    compression: 'snappy' as 'snappy' | 'gzip' | 'lz4',
    rowGroupSize: 10000
  }
});

// Available formats
const formats = [
  {
    id: 'json',
    name: 'JSON',
    description: 'JavaScript Object Notation - structured data format'
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'Comma-Separated Values - spreadsheet compatible'
  },
  {
    id: 'excel',
    name: 'Excel',
    description: 'Microsoft Excel workbook with multiple sheets'
  },
  {
    id: 'parquet',
    name: 'Parquet',
    description: 'Columnar storage format optimized for analytics'
  }
];

// Computed
const canExport = computed(() => {
  return selectedSources.value.length > 0 && selectedFormat.value && !isExporting.value;
});

const totalRecords = computed(() => {
  return selectedSources.value.reduce((total, sourceId) => {
    const source = props.dataSources.find(s => s.id === sourceId);
    return total + (source?.count || 0);
  }, 0);
});

const estimatedSize = computed(() => {
  const bytesPerRecord = selectedFormat.value === 'json' ? 500 : 
                        selectedFormat.value === 'csv' ? 200 :
                        selectedFormat.value === 'excel' ? 300 : 150;
  const totalBytes = totalRecords.value * bytesPerRecord;
  
  if (totalBytes < 1024) return `${totalBytes} B`;
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
  if (totalBytes < 1024 * 1024 * 1024) return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
});

const estimatedTime = computed(() => {
  const recordsPerSecond = 1000;
  const seconds = Math.ceil(totalRecords.value / recordsPerSecond);
  
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
  return `${Math.ceil(seconds / 3600)} hours`;
});

// Methods
const handleOverlayClick = () => {
  emit('close');
};

const handleExport = async () => {
  if (!canExport.value) return;

  isExporting.value = true;

  try {
    const config: ExportConfiguration = {
      formats: {
        [selectedFormat.value]: formatOptions.value[selectedFormat.value as keyof typeof formatOptions.value]
      },
      filters: {
        timeRange: getTimeRange(),
        agents: [],
        commandTypes: [],
        status: []
      }
    };

    emit('export', config);
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    isExporting.value = false;
  }
};

const getTimeRange = () => {
  const now = new Date();
  let start: Date;

  switch (timeRange.value) {
    case 'last-hour':
      start = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'last-24h':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'last-week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      start = new Date(customTimeRange.value.start);
      return {
        start,
        end: new Date(customTimeRange.value.end)
      };
    default:
      start = new Date(0);
  }

  return { start, end: now };
};
</script>

<style scoped>
.export-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.export-dialog {
  background: var(--theme-bg-primary);
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

/* Header */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--theme-border);
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--theme-text-primary);
}

.close-button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--theme-text-secondary);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
}

/* Content */
.dialog-content {
  padding: 1.5rem;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--theme-text-primary);
}

/* Data Sources */
.data-sources-grid {
  display: grid;
  gap: 0.75rem;
}

.data-source-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--theme-bg-secondary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.data-source-item:hover:not(.disabled) {
  border-color: var(--theme-primary);
}

.data-source-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.source-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.source-name {
  font-weight: 500;
  color: var(--theme-text-primary);
}

.source-count {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

/* Formats */
.format-grid {
  display: grid;
  gap: 0.75rem;
}

.format-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--theme-bg-secondary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.format-item:hover {
  border-color: var(--theme-primary);
}

.format-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.format-name {
  font-weight: 500;
  color: var(--theme-text-primary);
}

.format-description {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

/* Options */
.options-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-select {
  padding: 0.5rem;
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Time Range */
.time-range-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.time-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.custom-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-input {
  padding: 0.5rem;
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
}

/* Preview */
.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.preview-stat {
  text-align: center;
  padding: 1rem;
  background: var(--theme-bg-secondary);
  border-radius: 0.375rem;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--theme-text-primary);
}

/* Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--theme-border);
}

.cancel-button,
.export-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
}

.cancel-button:hover {
  background: var(--theme-bg-tertiary);
}

.export-button {
  background: var(--theme-primary);
  color: white;
  border: 1px solid var(--theme-primary);
}

.export-button:hover:not(:disabled) {
  background: var(--theme-primary-dark);
}

.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-button.loading {
  position: relative;
}

.export-button.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  border-radius: inherit;
  opacity: 0.8;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .export-dialog {
    background: #0f172a;
  }

  .data-source-item,
  .format-item,
  .preview-stat {
    background: #1e293b;
    border-color: #334155;
  }

  .option-select,
  .date-input {
    background: #1e293b;
    border-color: #334155;
  }
}
</style>