<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useThemeStore } from '@/stores/theme';
import axios from 'axios';
import ExcelJS from 'exceljs';
import {
  Calculator,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  Save,
  Trash2,
  Upload,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import VueApexCharts from 'vue3-apexcharts';

const themeStore = useThemeStore();

defineOptions({
  name: 'CapabilityAnalysis',
});

// --- Local Components ---

const { t } = useI18n();
const ApexChart = VueApexCharts;

// --- State ---
const dataInput = ref(
  '42\n41\n42.5\n41.5\n41\n42\n42.5\n41.5\n42.5\n42.5\n42\n42.5\n43\n42\n41.5\n42.5\n42\n42.5\n40.5\n41.5\n41\n42.5\n41.5\n42\n42.5\n42\n42\n42\n41.5\n44\n44\n44\n43\n43\n42\n42\n42.5\n41.5\n43\n43\n43\n42.5\n42\n43.5\n44\n44.5\n42.5\n42.5\n43\n42\n42\n42\n41.5\n40.5\n42.5\n42.5\n42\n41.5\n42\n43\n42.5\n42\n42.5\n42\n42.5\n42.5\n42\n43\n43.5\n41.5\n42\n42.5\n41.5\n42\n42.5\n42\n43\n43\n41.5\n42.5\n42.5\n43\n42.5\n42.5\n42.5\n42\n44\n43.5\n42\n42\n42.5\n43\n42.5\n43\n42\n42.5\n42\n41.5\n42\n42.5\n42\n41\n43\n42.5\n43\n41.5\n42\n43\n42\n43\n42\n42\n43\n42\n42.5\n40\n41\n42\n41\n41\n42\n42\n42\n41\n41.5\n41\n43.5\n42\n41.5\n42.5\n42.5\n41.5\n43\n45\n43\n42\n43\n42.5\n43\n44.5\n43\n44\n42.5\n43\n42\n46.5\n44\n44.5\n43\n46.5\n43\n43\n43.5\n44\n45\n44\n44.5\n44\n43\n43.5\n45\n44.5\n45\n45\n44.5\n43\n44.5\n43.5\n45\n43.5\n44\n45\n43.5\n43\n42\n43\n44.5\n43\n45\n43.5\n46\n43\n45.5\n45\n43\n45.5\n46\n43.5\n46\n46\n43\n43\n45\n43.5\n44.5\n43.5\n45\n45\n44\n44.5\n45\n44.5\n45\n44.5\n44\n44.5\n46\n45\n45\n45.5\n43\n44\n44\n45.5\n45\n42.5\n47\n45.5\n43.5\n44\n45.5\n46\n44\n45.5\n45.5\n44\n43.5\n44\n43\n44.5\n43\n46\n44\n45.5\n44.5\n45.5\n44.5\n45.5\n44.5\n42\n45.5\n45\n43\n44.5\n45.5\n45\n42.5\n44.5\n44.5\n45.5\n44.5\n43.5\n45.5\n43.5\n42.5\n43.5\n44.5\n44.5\n44.5\n43.5\n44\n43\n43.5\n41.5\n44.5\n43.5\n43.5\n42\n42.5\n43.5\n45.5\n41.5\n42\n42.5\n44.5\n42\n42.5\n43.5\n43\n43\n44.5\n43.5\n44\n42.5\n44.5\n42.5\n44.5\n43.5\n43.5\n43\n41.5\n42\n43.5\n44.5\n42.5\n42.5\n43\n43\n45.5\n44.5\n41\n43.5\n42.5\n42.5\n42.5\n42.5\n42.5\n43.5\n43\n43\n42.5\n41\n44\n43.5\n43\n43.5\n43.5\n43\n42\n43.5\n45\n42.5\n44\n44.5\n43.5\n44.5\n43.5\n42\n44.5\n42\n42.5\n42.5\n41.5\n42.5\n44\n43\n43.5\n42.5\n41.5\n41.5\n42.5\n43.5\n43\n45.5\n45.5\n44.5\n45\n41.5\n42.5\n41.5\n41.5\n41\n42.5\n42.5\n42\n44.5\n42.5\n42\n43\n42.5\n43\n41.5\n42.5\n42.5\n41.5\n41.5\n41\n42\n42.5\n41\n43.5\n43\n41\n42.5\n41.5\n43\n42.5\n41.5\n41.5\n43.5\n41\n42.5\n44.5\n42.5\n41.5\n42.5\n44.5\n42.5\n41.5\n43.5\n41.5\n42.5\n44.5\n41\n43.5\n43\n43.5\n44.5\n44\n42\n43\n43.5\n44\n42.5\n43.5\n41\n41.5\n42.5\n41\n43\n41.5\n43\n45.5\n42\n43.5\n43\n44\n42\n41.5\n41.5\n42\n41.5\n42\n43.5\n41\n42.5\n40.5\n42\n43.5\n42.5\n43\n41.5\n42\n44.5\n45\n42.5\n41.5\n43\n42\n41.5\n42.5\n46\n45\n42.5\n45\n44\n45\n45.5\n41\n41\n42\n42.5\n41\n41.5\n42.5\n42.5\n44\n44.5\n44\n42\n42.5\n41\n42.5\n41.5\n44.5\n41\n40.5\n41\n44\n43\n44\n42.5\n41.5\n41.5\n41.5\n42.5\n43.5\n41.5\n42.5\n43\n44.5\n42\n43\n42.5\n42.5\n43\n41.5\n44\n42\n42.5\n41.5\n41\n42.5\n42.5\n41\n42.5\n43.5'
);
const analysisTitle = ref('New CPK Analysis');
const savedAnalyses = ref<any[]>([]);
const isSaving = ref(false);
const isLoadingHistory = ref(false);
const API_URL = 'http://localhost:2530/cpk-analyses';
const lsl = ref(38);
const usl = ref(48);
const subgroupSize = ref(18);
const csvColumns = ref<string[]>([]);
const selectedColumn = ref('');
const rawCsvData = ref<string[][]>([]);

// --- Statistical Constants ---
const getStatsConstants = (n: number) => {
  const table: Record<number, any> = {
    2: { a3: 2.659, b3: 0, b4: 3.267, c4: 0.7979 },
    3: { a3: 1.954, b3: 0, b4: 2.568, c4: 0.8862 },
    4: { a3: 1.628, b3: 0, b4: 2.266, c4: 0.9213 },
    5: { a3: 1.427, b3: 0, b4: 2.089, c4: 0.94 },
    6: { a3: 1.287, b3: 0.03, b4: 1.97, c4: 0.9515 },
    7: { a3: 1.182, b3: 0.118, b4: 1.882, c4: 0.9594 },
    8: { a3: 1.099, b3: 0.185, b4: 1.815, c4: 0.965 },
    9: { a3: 1.032, b3: 0.239, b4: 1.761, c4: 0.9693 },
    10: { a3: 0.975, b3: 0.284, b4: 1.716, c4: 0.9727 },
  };
  return table[n] || table[5];
};

// normalPDF removed as it is now unused in the minimalist view.

const normalCDF = (x: number, mean: number, std: number) => {
  if (std === 0) return x < mean ? 0 : 1;
  const z = (x - mean) / std;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + 0.2316419 * absZ);
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const d = 0.3989422804;
  const p = d * Math.exp(-(z * z) / 2.0) * t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  return z >= 0 ? 1.0 - p : p;
};

// --- CSV Handling ---
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map((h) => h.trim());
    csvColumns.value = headers;

    rawCsvData.value = lines.slice(1).map((line) => line.split(','));

    if (headers.length > 0) {
      handleColumnChange(headers[0]);
    }
  };
  reader.readAsText(file);
};

const handleColumnChange = (colName: string) => {
  selectedColumn.value = colName;
  const colIndex = csvColumns.value.indexOf(colName);
  if (colIndex === -1) return;

  const columnValues = rawCsvData.value
    .map((row) => row[colIndex])
    .filter((val) => val !== undefined && val !== '')
    .join('\n');
  dataInput.value = columnValues;
};

// --- Theme Colors ---
const primaryColor = computed(() => {
  const color = themeStore.colors[themeStore.themeColor] || themeStore.colors.blue;
  return `hsl(${color.primary})`;
});

// --- Calculations ---
const results = computed(() => {
  const numbers = dataInput.value
    .split(/[\s,\n,]+/)
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v));

  if (numbers.length < 2) return null;

  const nTotal = numbers.length;
  const meanTotal = numbers.reduce((a, b) => a + b, 0) / nTotal;

  // Subgroup Analysis
  const subgroupData = [];
  let sumOfSquaresWithin = 0;
  let totalDfWithin = 0;

  for (let i = 0; i < numbers.length; i += subgroupSize.value) {
    const group = numbers.slice(i, i + subgroupSize.value);
    if (group.length > 0) {
      const gMean = group.reduce((a, b) => a + b, 0) / group.length;
      const gVar =
        group.length > 1
          ? group.reduce((sq, n) => sq + Math.pow(n - gMean, 2), 0) / (group.length - 1)
          : 0;

      if (group.length > 1) {
        sumOfSquaresWithin += (group.length - 1) * gVar;
        totalDfWithin += group.length - 1;
      }

      subgroupData.push({
        index: Math.floor(i / subgroupSize.value) + 1,
        mean: gMean,
        stdev: Math.sqrt(gVar),
        points: group,
      });
    }
  }

  // Within Standard Deviation Calculation
  // Minitab uses pooled standard deviation: sqrt(sum of squared deviations / total df)
  // Then applies c4 correction based on total degrees of freedom

  const validSubgroups = subgroupData.filter((g) => g.stdev >= 0);

  // Calculate pooled standard deviation
  const sPooled = totalDfWithin > 0 ? Math.sqrt(sumOfSquaresWithin / totalDfWithin) : 0;

  // For c4 correction, use total degrees of freedom
  const getC4 = (df: number): number => {
    if (df <= 0) return 1;
    if (df === 1) return 0.7979;
    if (df === 2) return 0.8862;
    if (df === 3) return 0.9213;
    if (df === 4) return 0.94;
    if (df === 5) return 0.9515;
    if (df === 6) return 0.9594;
    if (df === 7) return 0.965;
    if (df === 8) return 0.9693;
    if (df === 9) return 0.9727;
    if (df === 10) return 0.9754;
    // For larger df, use high-precision approximation
    return 1 - 1 / (4 * df) - 7 / (32 * df * df);
  };

  const c4 = getC4(totalDfWithin);
  const stdevWithin = sPooled / c4;

  const stdevOverall = Math.sqrt(
    numbers.reduce((sq, n) => sq + Math.pow(n - meanTotal, 2), 0) / (nTotal - 1)
  );

  const avgMean = validSubgroups.reduce((a, b) => a + b.mean, 0) / validSubgroups.length;

  // --- Control Limits ---
  const constants = getStatsConstants(subgroupSize.value);

  // Xbar Chart
  const xbarUCL = avgMean + constants.a3 * sPooled;
  const xbarLCL = avgMean - constants.a3 * sPooled;

  // --- Histogram & Curves ---
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const range = max - min;
  const numBins = Math.ceil(Math.sqrt(nTotal));
  const binSize = range / numBins;

  const bins = Array.from({ length: numBins }, (_, i) => ({
    start: min + i * binSize,
    end: min + (i + 1) * binSize,
    count: 0,
  }));

  numbers.forEach((v) => {
    const binIndex = Math.min(Math.floor((v - min) / binSize), numBins - 1);
    if (binIndex >= 0) bins[binIndex].count++;
  });

  const histogramData = bins.map((b) => ({
    x: (b.start + b.end) / 2,
    y: b.count / (nTotal * binSize), // Density
  }));

  // Normal curves for histogram
  const curvePoints = 50;
  const curveX = Array.from(
    { length: curvePoints },
    (_, i) => min - range * 0.1 + (range * 1.2 * i) / (curvePoints - 1)
  );
  const withinCurve = curveX.map((x) => ({
    x,
    y:
      (1 / (stdevWithin * Math.sqrt(2 * Math.PI))) *
      Math.exp(-Math.pow(x - avgMean, 2) / (2 * Math.pow(stdevWithin, 2))),
  }));
  const overallCurve = curveX.map((x) => ({
    x,
    y:
      (1 / (stdevOverall * Math.sqrt(2 * Math.PI))) *
      Math.exp(-Math.pow(x - meanTotal, 2) / (2 * Math.pow(stdevOverall, 2))),
  }));

  // --- Capability Indices ---
  const cp = (usl.value - lsl.value) / (6 * stdevWithin);
  const cpk = Math.min(
    (usl.value - meanTotal) / (3 * stdevWithin),
    (meanTotal - lsl.value) / (3 * stdevWithin)
  );
  const pp = (usl.value - lsl.value) / (6 * stdevOverall);
  const ppk = Math.min(
    (usl.value - meanTotal) / (3 * stdevOverall),
    (meanTotal - lsl.value) / (3 * stdevOverall)
  );

  const target = (usl.value + lsl.value) / 2;
  const cpm = cp / Math.sqrt(1 + Math.pow((meanTotal - target) / stdevWithin, 2));

  const pAboveUslWithin = 1 - normalCDF(usl.value, meanTotal, stdevWithin);
  const pBelowLslWithin = normalCDF(lsl.value, meanTotal, stdevWithin);
  const ppmWithin = (pAboveUslWithin + pBelowLslWithin) * 1000000;

  const pAboveUslOverall = 1 - normalCDF(usl.value, meanTotal, stdevOverall);
  const pBelowLslOverall = normalCDF(lsl.value, meanTotal, stdevOverall);
  const ppmOverall = (pAboveUslOverall + pBelowLslOverall) * 1000000;

  return {
    mean: meanTotal,
    stdevWithin,
    stdevOverall,
    cp,
    cpk,
    pp,
    ppk,
    cpm,
    ppmWithin,
    ppmOverall,
    subgroupData,
    xbarUCL,
    xbarLCL,
    avgMean,
    histogramData,
    withinCurve,
    overallCurve,
    dataPointsCount: numbers.length,
  };
});

// --- Actions ---

const exportToExcel = async () => {
  if (!results.value) return;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('CPK Analysis');

    // Styles
    const headerFont = { bold: true, size: 12 };
    const titleFont = { bold: true, size: 14 };

    // Title
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'CPK Analysis Report';
    worksheet.getCell('A1').font = titleFont;

    // Stats
    worksheet.addRow([]);
    worksheet.addRow(['Statistics Summary']).font = headerFont;
    worksheet.addRow(['Mean', results.value.mean.toFixed(3)]);
    worksheet.addRow(['StDev (Within)', results.value.stdevWithin.toFixed(3)]);
    worksheet.addRow(['StDev (Overall)', results.value.stdevOverall.toFixed(3)]);
    worksheet.addRow(['Cp', results.value.cp.toFixed(2)]);
    worksheet.addRow(['Cpk', results.value.cpk.toFixed(2)]);
    worksheet.addRow(['Pp', results.value.pp.toFixed(2)]);
    worksheet.addRow(['Ppk', results.value.ppk.toFixed(2)]);
    worksheet.addRow(['PPM (Within)', results.value.ppmWithin.toFixed(2)]);
    worksheet.addRow(['PPM (Overall)', results.value.ppmOverall.toFixed(2)]);

    // Specs
    worksheet.addRow([]);
    worksheet.addRow(['Specifications']).font = headerFont;
    worksheet.addRow(['LSL', lsl.value]);
    worksheet.addRow(['USL', usl.value]);
    worksheet.addRow(['Subgroup Size', subgroupSize.value]);

    // Raw Data
    worksheet.addRow([]);
    worksheet.addRow(['Raw Data Points']).font = headerFont;
    const dataRows = results.value.subgroupData.flatMap((g) => g.points.map((p) => [p]));
    worksheet.addRows(dataRows);

    // Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `CPK_Analysis_${new Date().toISOString().slice(0, 10)}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);

    toast.success('Excel report exported successfully');
  } catch (error) {
    console.error('Excel Export Error:', error);
    toast.error('Failed to export Excel report');
  }
};

const saveAnalysis = async () => {
  if (!results.value) return;

  isSaving.value = true;
  try {
    const payload = {
      title: analysisTitle.value,
      lsl: lsl.value,
      usl: usl.value,
      subgroupSize: subgroupSize.value,
      dataPoints: dataInput.value
        .split('\n')
        .map((v) => parseFloat(v))
        .filter((v) => !isNaN(v)),
    };
    await axios.post(API_URL, payload);
    toast.success('CPK Analysis saved successfully');
    await fetchHistory();
  } catch (error) {
    console.error('Save Error:', error);
    toast.error('Failed to save analysis');
  } finally {
    isSaving.value = false;
  }
};

const fetchHistory = async () => {
  isLoadingHistory.value = true;
  try {
    const response = await axios.get(API_URL);
    savedAnalyses.value = response.data;
  } catch (error) {
    console.error('Fetch History Error:', error);
    toast.error('Failed to fetch analysis history');
  } finally {
    isLoadingHistory.value = false;
  }
};

const loadAnalysis = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    const data = response.data;
    analysisTitle.value = data.title;
    lsl.value = data.lsl;
    usl.value = data.usl;
    subgroupSize.value = data.subgroupSize;
    dataInput.value = data.dataPoints.join('\n');
    toast.success(`Loaded: ${data.title}`);
  } catch (error) {
    console.error('Load Error:', error);
    toast.error('Failed to load analysis');
  }
};

const deleteAnalysis = async (id: string) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    toast.success('Analysis deleted');
    await fetchHistory();
  } catch (error) {
    console.error('Delete Error:', error);
    toast.error('Failed to delete analysis');
  }
};

onMounted(fetchHistory);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
          <Calculator :size="24" class="text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">CPK Analysis</h1>
          <div class="flex items-center gap-2 mt-1">
            <span
              class="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider"
              >Statistical Control</span
            >
            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
            <input
              v-model="analysisTitle"
              class="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg px-3 py-1.5 w-80 transition-all outline-none"
              placeholder="Enter analysis title..."
            />
          </div>
        </div>
      </div>
      <div class="flex gap-3">
        <label
          class="h-10 cursor-pointer bg-white border-2 border-slate-200 hover:bg-slate-50 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Upload :size="16" class="text-primary" />
          <span>{{ t('qa.cpk.uploadCsv') }}</span>
          <input type="file" accept=".csv" class="hidden" @change="handleFileUpload" />
        </label>
        <Button
          variant="outline"
          class="h-10 px-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-2 group shadow-sm"
          @click="exportToExcel"
          :disabled="!results"
        >
          <Download :size="16" class="text-slate-400 group-hover:text-green-600" />
          <span>Export Excel</span>
        </Button>
        <Button
          class="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_4px_12px_hsl(var(--primary)/0.2)] transition-all flex items-center gap-2"
          @click="saveAnalysis"
          :disabled="!results || isSaving"
        >
          <Save :size="16" v-if="!isSaving" />
          <Loader2 :size="16" class="animate-spin" v-else />
          <span>{{ isSaving ? 'Saving...' : 'Save Results' }}</span>
        </Button>
      </div>
    </div>

    <!-- CSV Column Selection -->
    <div
      v-if="csvColumns.length > 0"
      class="mt-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
    >
      <FileSpreadsheet :size="14" class="text-green-600" />
      <span class="text-[10px] font-bold text-slate-500 uppercase"
        >{{ t('qa.cpk.selectColumn') }}:</span
      >
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="col in csvColumns"
          :key="col"
          variant="ghost"
          size="sm"
          :class="[
            'h-7 px-3 rounded-full text-[10px] font-bold transition-all',
            selectedColumn === col
              ? 'bg-primary text-white hover:bg-primary/90 shadow-md'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
          ]"
          @click="handleColumnChange(col)"
        >
          {{ col }}
        </button>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left: History -->
      <Card
        class="lg:col-span-2 border-2 border-slate-100 shadow-none overflow-hidden flex flex-col h-[320px]"
      >
        <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
          <History :size="14" class="text-slate-400" />
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500"
            >History</span
          >
        </div>
        <CardContent class="p-0 overflow-y-auto flex-1">
          <div v-if="isLoadingHistory" class="p-8 flex flex-col items-center justify-center gap-2">
            <Loader2 class="animate-spin text-slate-300" :size="24" />
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
              >Loading...</span
            >
          </div>
          <div v-else-if="savedAnalyses.length === 0" class="p-8 text-center">
            <p
              class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed"
            >
              No history found
            </p>
          </div>
          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="item in savedAnalyses"
              :key="item.id"
              class="p-2 hover:bg-slate-50 transition-colors cursor-pointer group relative"
              @click="loadAnalysis(item.id)"
            >
              <div class="flex flex-col gap-0.5 pr-6">
                <span class="text-[10px] font-bold text-slate-700 truncate">{{ item.title }}</span>
                <span class="text-[8px] font-medium text-slate-400">{{
                  new Date(item.createdAt).toLocaleDateString()
                }}</span>
              </div>
              <button
                @click.stop="deleteAnalysis(item.id)"
                class="absolute right-1 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded transition-all"
              >
                <Trash2 :size="10" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Middle: Inputs -->
      <Card
        class="lg:col-span-4 border-2 border-slate-100 shadow-none overflow-hidden flex flex-col h-[320px]"
      >
        <div
          class="px-3 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between"
        >
          <div class="flex items-center gap-1.5">
            <FileSpreadsheet :size="14" class="text-slate-400" />
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500"
              >Data Input</span
            >
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5">
              <span class="text-[9px] font-black text-slate-400 uppercase">LSL</span>
              <input
                v-model.number="lsl"
                type="number"
                class="w-12 h-6 bg-white border border-slate-200 rounded text-xs font-black text-center focus:border-primary focus:ring-0 transition-colors"
              />
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-[9px] font-black text-slate-400 uppercase">USL</span>
              <input
                v-model.number="usl"
                type="number"
                class="w-12 h-6 bg-white border border-slate-200 rounded text-xs font-black text-center focus:border-primary focus:ring-0 transition-colors"
              />
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[9px] font-black text-slate-400 uppercase">Size</span>
              <input
                v-model.number="subgroupSize"
                type="number"
                class="w-10 h-6 bg-white border border-slate-200 rounded text-xs font-black text-center focus:border-primary focus:ring-0 transition-colors"
              />
            </div>
          </div>
        </div>
        <CardContent class="p-0 flex-1">
          <textarea
            v-model="dataInput"
            class="w-full h-full p-4 text-xs font-medium text-slate-600 bg-white border-none focus:ring-0 transition-all resize-none leading-relaxed"
            placeholder="Paste your numerical data here..."
          ></textarea>
        </CardContent>
      </Card>

      <!-- Right: Results / Empty State -->
      <Card
        class="lg:col-span-6 border-2 border-slate-100 shadow-none overflow-hidden flex flex-col h-[320px]"
      >
        <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
          <Calculator :size="14" class="text-slate-400" />
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500"
            >CPK Statistics</span
          >
        </div>

        <CardContent class="p-0 flex-1 overflow-hidden bg-white">
          <div v-if="results" class="h-full flex flex-col">
            <!-- Content Grid -->
            <div class="grid grid-cols-[140px,1fr,140px] divide-x divide-slate-100 flex-1">
              <!-- Within Stats -->
              <div class="p-4 flex flex-col items-center justify-center">
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Within
                </h4>
                <div class="w-full space-y-3">
                  <div class="flex justify-between items-center group">
                    <span class="text-[11px] font-bold text-slate-600">StDev</span>
                    <span class="text-[11px] font-black text-slate-900 tabular-nums">{{
                      results.stdevWithin.toFixed(2)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center group">
                    <span class="text-[11px] font-bold text-slate-600">Cp</span>
                    <span class="text-xs font-black text-primary tabular-nums">{{
                      results.cp.toFixed(2)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center group">
                    <span class="text-[11px] font-bold text-slate-600">Cpk</span>
                    <span
                      class="text-xs font-black tabular-nums"
                      :class="results.cpk < 1.33 ? 'text-orange-500' : 'text-primary'"
                    >
                      {{ results.cpk.toFixed(2) }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center group">
                    <span class="text-[11px] font-bold text-slate-600">PPM</span>
                    <span class="text-[11px] font-black text-slate-900 tabular-nums">{{
                      Math.round(results.ppmWithin)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Center Visuals -->
              <div class="p-5 flex flex-col justify-center bg-slate-50/30">
                <div class="space-y-6">
                  <!-- Within -->
                  <div class="space-y-2">
                    <div
                      class="flex justify-between text-[10px] font-black uppercase tracking-wider"
                    >
                      <span class="text-primary">Within (Cpk)</span>
                      <span class="text-slate-900">{{ results.cpk.toFixed(2) }}</span>
                    </div>
                    <div class="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        class="absolute h-full bg-primary/20 rounded-full transition-all duration-700 ease-out"
                        :style="{ width: `${Math.min((results.cpk / 2) * 100, 100)}%` }"
                      ></div>
                      <div
                        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-0.5 bg-primary rounded-full"
                      ></div>
                    </div>
                  </div>

                  <!-- Overall -->
                  <div class="space-y-2">
                    <div
                      class="flex justify-between text-[10px] font-black uppercase tracking-wider"
                    >
                      <span class="text-orange-600">Overall (Ppk)</span>
                      <span class="text-slate-900">{{ results.ppk.toFixed(2) }}</span>
                    </div>
                    <div class="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        class="absolute h-full bg-orange-600/20 rounded-full transition-all duration-700 ease-out"
                        :style="{ width: `${Math.min((results.ppk / 2) * 100, 100)}%` }"
                      ></div>
                      <div
                        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-0.5 bg-orange-600 rounded-full"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Overall Stats -->
              <div class="p-4 flex flex-col items-center justify-center">
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Overall
                </h4>
                <div class="w-full space-y-3">
                  <div class="flex justify-between items-center group">
                    <span class="text-[11px] font-bold text-slate-600">StDev</span>
                    <span class="text-[11px] font-black text-slate-900 tabular-nums">{{
                      results.stdevOverall.toFixed(2)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center group">
                    <span class="text-[11px] font-bold text-slate-600">Pp</span>
                    <span class="text-xs font-black text-orange-600 tabular-nums">{{
                      results.pp.toFixed(2)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center group">
                    <span class="text-[11px] font-bold text-slate-600">Ppk</span>
                    <span
                      class="text-xs font-black tabular-nums"
                      :class="results.ppk < 1.33 ? 'text-orange-500' : 'text-orange-600'"
                    >
                      {{ results.ppk.toFixed(2) }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center group">
                    <span class="text-[11px] font-bold text-slate-600">Cpm</span>
                    <span class="text-xs font-black text-orange-600 tabular-nums">{{
                      results.cpm.toFixed(2)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/10 p-6"
          >
            <div class="p-4 bg-white rounded-2xl mb-4 border border-slate-100 group shadow-sm">
              <Calculator
                :size="24"
                class="text-primary/30 group-hover:text-primary transition-colors duration-500"
              />
            </div>
            <h3 class="font-bold text-slate-900 text-[10px] uppercase tracking-widest">
              No analysis data
            </h3>
            <p class="text-[9px] mt-1 text-slate-400 text-center max-w-[160px] font-medium">
              Input data or select from history to view results
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- CPK Analysis Dashboard -->
    <div v-if="results" class="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
      <!-- Row 1: Xbar and CPK Histogram -->
      <Card class="border-2 border-slate-100 shadow-none overflow-hidden h-[300px]">
        <div
          class="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between"
        >
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500"
            >Xbar Chart</span
          >
          <div class="flex gap-4 text-[9px] font-bold text-slate-400">
            <span class="text-red-500">UCL: {{ results.xbarUCL.toFixed(2) }}</span>
            <span class="text-green-600">CL: {{ results.avgMean.toFixed(2) }}</span>
            <span class="text-red-500">LCL: {{ results.xbarLCL.toFixed(2) }}</span>
          </div>
        </div>
        <ApexChart
          type="line"
          height="250"
          :options="{
            chart: { toolbar: { show: false }, zoom: { enabled: false } },
            stroke: {
              width: [2, 1.5, 1.5, 1.5],
              dashArray: [0, 0, 0, 0],
              colors: ['#000000', '#ef4444', '#ef4444', '#22c55e'],
            },
            markers: {
              size: [4, 0, 0, 0],
              colors: ['#000000'],
              strokeColors: '#fff',
              strokeWidth: 2,
              hover: { size: 6 },
            },
            xaxis: {
              labels: { show: false },
              axisBorder: { show: true, color: '#e2e8f0' },
            },
            yaxis: {
              labels: { style: { fontSize: '10px', fontWeight: 600 } },
            },
            grid: {
              borderColor: '#f1f5f9',
              xaxis: { lines: { show: false } },
            },
            legend: { show: false },
            colors: ['#000000', '#ef4444', '#ef4444', '#22c55e'],
          }"
          :series="[
            { name: 'Mean', data: results.subgroupData.map((d) => d.mean.toFixed(3)) },
            { name: 'UCL', data: results.subgroupData.map(() => results?.xbarUCL.toFixed(3)) },
            { name: 'LCL', data: results.subgroupData.map(() => results?.xbarLCL.toFixed(3)) },
            { name: 'CL', data: results.subgroupData.map(() => results?.avgMean.toFixed(3)) },
          ]"
        />
      </Card>

      <Card class="border-2 border-slate-100 shadow-none overflow-hidden h-[300px]">
        <div class="px-4 py-2 bg-slate-50/50 border-b border-slate-100">
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500"
            >CPK Histogram</span
          >
        </div>
        <ApexChart
          type="line"
          height="250"
          :options="{
            chart: { toolbar: { show: false } },
            stroke: { width: [0, 2.5, 2], dashArray: [0, 0, 5], curve: 'smooth' },
            colors: [primaryColor, '#ef4444', '#000000'],
            plotOptions: {
              bar: {
                borderRadius: 0,
                columnWidth: '95%',
              },
            },
            fill: { opacity: [1, 1, 1] },
            xaxis: {
              type: 'numeric',
              labels: { style: { fontSize: '10px', fontWeight: 600 } },
              axisBorder: { show: true, color: '#e2e8f0' },
            },
            yaxis: { show: false },
            grid: { show: false },
            legend: {
              position: 'top',
              fontSize: '10px',
              fontWeight: 700,
            },
          }"
          :series="[
            { name: 'Data', type: 'column', data: results.histogramData },
            { name: 'Overall', type: 'line', data: results.overallCurve },
            { name: 'Within', type: 'line', data: results.withinCurve },
          ]"
        />
      </Card>
    </div>
  </div>
</template>

<style scoped>
textarea::-webkit-scrollbar {
  width: 6px;
}
textarea::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

/* Hide number spinners */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
  appearance: none;
}
</style>
