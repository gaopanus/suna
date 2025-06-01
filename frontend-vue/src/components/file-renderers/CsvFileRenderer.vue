<template>
  <v-card flat class="csv-file-renderer my-2" :variant="cardVariant" :border="border">
    <v-toolbar density="compact" color="grey-lighten-4" flat v-if="effectiveFileName">
      <v-toolbar-title class="text-caption font-weight-medium">
        {{ effectiveFileName }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        v-if="src || content"
        icon="mdi-download"
        variant="text"
        size="small"
        @click="downloadCsv"
        title="Download CSV file"
      ></v-btn>
    </v-toolbar>
    <v-divider v-if="effectiveFileName"></v-divider>

    <div v-if="isLoading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary" class="my-3"></v-progress-circular>
      <p>Loading CSV data...</p>
    </div>
    <div v-else-if="error" class="pa-4">
      <v-alert type="error" density="compact">
        Error loading or parsing CSV: {{ error }}
      </v-alert>
    </div>
    <div v-else-if="headers.length > 0 && dataRows.length > 0" class="table-responsive">
      <v-table density="compact" hover class="csv-table">
        <thead>
          <tr>
            <th v-for="(header, index) in headers" :key="`header-${index}`" class="text-left text-subtitle-2">
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in displayedRows" :key="`row-${rowIndex}`">
            <td v-for="(cell, cellIndex) in row" :key="`cell-${rowIndex}-${cellIndex}`" class="text-caption">
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="dataRows.length > maxRowsToShow" class="pa-2 text-caption text-center text-grey">
        Displaying first {{ maxRowsToShow }} of {{ dataRows.length }} total rows.
        <v-btn variant="text" size="small" color="primary" @click="showAllRows" v-if="!showingAll">Show all</v-btn>
        <v-btn variant="text" size="small" color="primary" @click="showLimitedRows" v-if="showingAll">Show less</v-btn>
      </div>
    </div>
    <div v-else class="pa-4 text-center text-grey">
      No data to display. CSV might be empty or malformed.
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import Papa from 'papaparse'; // Import PapaParse

const props = defineProps({
  src: { // URL to fetch the CSV from
    type: String,
    default: null,
  },
  content: { // Direct CSV string content
    type: String,
    default: null,
  },
  fileName: { // Optional, used for display
    type: String,
    default: 'data.csv',
  },
  maxRowsToShow: { // Initial number of rows to display
    type: Number,
    default: 50,
  },
  cardVariant: {
    type: String,
    default: 'outlined'
  },
  border: {
    type: [Boolean, String],
    default: true,
  }
});

const rawContent = ref('');
const headers = ref([]);
const dataRows = ref([]); // All parsed data rows (excluding headers)
const isLoading = ref(false);
const error = ref(null);
const showingAll = ref(false);


const effectiveFileName = computed(() => props.fileName || (props.src ? props.src.split('/').pop() : 'data.csv'));

const displayedRows = computed(() => {
    return showingAll.value ? dataRows.value : dataRows.value.slice(0, props.maxRowsToShow);
});

function showAllRows() {
    showingAll.value = true;
}
function showLimitedRows() {
    showingAll.value = false;
}

function parseCsv(csvString) {
  if (!csvString || typeof csvString !== 'string') {
    error.value = 'No CSV content to parse.';
    headers.value = [];
    dataRows.value = [];
    return;
  }
  try {
    const result = Papa.parse(csvString, {
      header: false, // We'll take the first row as header manually
      skipEmptyLines: true,
      dynamicTyping: true, // Convert numbers and booleans
    });

    if (result.errors && result.errors.length > 0) {
      console.warn('CSV parsing errors:', result.errors);
      // Decide if partial data is acceptable or throw error
      // For now, try to use data if available
    }

    if (result.data && result.data.length > 0) {
      headers.value = result.data[0].map(String); // First row as headers, convert all to string
      dataRows.value = result.data.slice(1);
      error.value = null; // Clear previous errors
    } else {
      headers.value = [];
      dataRows.value = [];
      if (result.errors.length === 0) { // No data but also no explicit errors
          error.value = 'CSV is empty or contains no data.';
      } else {
          error.value = `Failed to parse CSV: ${result.errors[0]?.message || 'Unknown parsing error'}`;
      }
    }
  } catch (err) {
    console.error('Error parsing CSV with PapaParse:', err);
    error.value = err.message;
    headers.value = [];
    dataRows.value = [];
  }
}

async function fetchCsvContent() {
  if (!props.src) return;
  isLoading.value = true;
  error.value = null;
  headers.value = [];
  dataRows.value = [];
  try {
    const response = await fetch(props.src);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    rawContent.value = await response.text();
    parseCsv(rawContent.value);
  } catch (err) {
    console.error('Error fetching CSV content:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    fetchCsvContent();
  } else if (props.content) {
    rawContent.value = props.content;
    parseCsv(rawContent.value);
    error.value = null; // Clear error if content is directly provided
  } else {
      rawContent.value = '';
      headers.value = [];
      dataRows.value = [];
      error.value = null;
  }
}, { immediate: true });

watch(() => props.content, (newContent) => {
  if (!props.src) { // Only update from content prop if src is not active
    rawContent.value = newContent || '';
    parseCsv(rawContent.value);
    error.value = null;
    isLoading.value = false;
  }
});

onMounted(() => {
  if (props.src) {
    // fetchCsvContent is called by watcher
  } else if (props.content) {
    rawContent.value = props.content;
    parseCsv(rawContent.value);
  }
});

function downloadCsv() {
    const contentToDownload = props.src ? rawContent.value : props.content;
    if (!contentToDownload) {
        alert('No CSV content to download.');
        return;
    }
    const blob = new Blob([contentToDownload], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = effectiveFileName.value;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

</script>

<style scoped>
.csv-file-renderer {
  /* border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); */
}
.table-responsive {
  overflow-x: auto; /* Allows table to scroll horizontally if content is too wide */
  width: 100%;
}
.csv-table {
  width: 100%; /* Ensure table tries to use available width */
  min-width: 600px; /* Example: Set a min-width if tables often have many columns */
}
.csv-table th, .csv-table td {
  white-space: nowrap; /* Prevent text wrapping in cells initially */
  /* Consider adding text-overflow: ellipsis; and max-width if needed */
}
</style>
