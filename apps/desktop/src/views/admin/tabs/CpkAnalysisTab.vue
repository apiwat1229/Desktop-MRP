<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Calculator, FileSpreadsheet, Upload } from 'lucide-vue-next';
import { computed, defineComponent, h, ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineOptions({
  name: 'CapabilityAnalysis',
});

// --- Local Components ---
const StatItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    highlight: { type: Boolean, default: false },
    color: { type: String, default: 'text-slate-700' },
  },
  setup(props) {
    return () =>
      h('div', { class: 'flex items-center justify-between' }, [
        h('span', { class: 'text-[10px] font-bold text-slate-400 uppercase' }, props.label),
        h(
          'span',
          {
            class: [
              'text-xs font-black tabular-nums',
              props.highlight ? 'bg-slate-50 px-2 py-0.5 rounded border border-slate-100' : '',
              props.color,
            ],
          },
          props.value
        ),
      ]);
  },
});

const ChartContainer = defineComponent({
  props: { title: String },
  setup(props, { slots }) {
    return () =>
      h(
        Card,
        { class: 'bg-white border-none shadow-sm transition-all hover:shadow-md overflow-hidden' },
        {
          default: () =>
            h(
              CardContent,
              { class: 'p-6' },
              {
                default: () => [
                  h(
                    'h3',
                    {
                      class:
                        'text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2',
                    },
                    [h('div', { class: 'w-1.5 h-1.5 bg-blue-500 rounded-full' }), props.title]
                  ),
                  slots.default?.(),
                ],
              }
            ),
        }
      );
  },
});

const { t } = useI18n();

// --- State ---
const dataInput = ref(
  '42\n41\n42.5\n41.5\n41\n42\n42.5\n41.5\n42.5\n42.5\n42\n42.5\n43\n42\n41.5\n42.5\n42\n42.5\n40.5\n41.5\n41\n42.5\n41.5\n42\n42.5\n42\n42\n42\n41.5\n44\n44\n44\n43\n43\n42\n42\n42.5\n41.5\n43\n43\n43\n42.5\n42\n43.5\n44\n44.5\n42.5\n42.5\n43\n42\n42\n42\n41.5\n40.5\n42.5\n42.5\n42\n41.5\n42\n43\n42.5\n42\n42.5\n42\n42.5\n42.5\n42\n43\n43.5\n41.5\n42\n42.5\n41.5\n42\n42.5\n42\n43\n43\n41.5\n42.5\n42.5\n43\n42.5\n42.5\n42.5\n42\n44\n43.5\n42\n42\n42.5\n43\n42.5\n43\n42\n42.5\n42\n41.5\n42\n42.5\n42\n41\n43\n42.5\n43\n41.5\n42\n43\n42\n43\n42\n42\n43\n42\n42.5\n40\n41\n42\n41\n41\n42\n42\n42\n41\n41.5\n41\n43.5\n42\n41.5\n42.5\n42.5\n41.5\n43\n45\n43\n42\n43\n42.5\n43\n44.5\n43\n44\n42.5\n43\n42\n46.5\n44\n44.5\n43\n46.5\n43\n43\n43.5\n44\n45\n44\n44.5\n44\n43\n43.5\n45\n44.5\n45\n45\n44.5\n43\n44.5\n43.5\n45\n43.5\n44\n45\n43.5\n43\n42\n43\n44.5\n43\n45\n43.5\n46\n43\n45.5\n45\n43\n45.5\n46\n43.5\n46\n46\n43\n43\n45\n43.5\n44.5\n43.5\n45\n45\n44\n44.5\n45\n44.5\n45\n44.5\n44\n44.5\n46\n45\n45\n45.5\n43\n44\n44\n45.5\n45\n42.5\n47\n45.5\n43.5\n44\n45.5\n46\n44\n45.5\n45.5\n44\n43.5\n44\n43\n44.5\n43\n46\n44\n45.5\n44.5\n45.5\n44.5\n45.5\n44.5\n42\n45.5\n45\n43\n44.5\n45.5\n45\n42.5\n44.5\n44.5\n45.5\n44.5\n43.5\n45.5\n43.5\n42.5\n43.5\n44.5\n44.5\n44.5\n43.5\n44\n43\n43.5\n41.5\n44.5\n43.5\n43.5\n42\n42.5\n43.5\n45.5\n41.5\n42\n42.5\n44.5\n42\n42.5\n43.5\n43\n43\n44.5\n43.5\n44\n42.5\n44.5\n42.5\n44.5\n43.5\n43.5\n43\n41.5\n42\n43.5\n44.5\n42.5\n42.5\n43\n43\n45.5\n44.5\n41\n43.5\n42.5\n42.5\n42.5\n42.5\n42.5\n43.5\n43\n43\n42.5\n41\n44\n43.5\n43\n43.5\n43.5\n43\n42\n43.5\n45\n42.5\n44\n44.5\n43.5\n44.5\n43.5\n42\n44.5\n42\n42.5\n42.5\n41.5\n42.5\n44\n43\n43.5\n42.5\n41.5\n41.5\n42.5\n43.5\n43\n45.5\n45.5\n44.5\n45\n41.5\n42.5\n41.5\n41.5\n41\n42.5\n42.5\n42\n44.5\n42.5\n42\n43\n42.5\n43\n41.5\n42.5\n42.5\n41.5\n41.5\n41\n42\n42.5\n41\n43.5\n43\n41\n42.5\n41.5\n43\n42.5\n41.5\n41.5\n43.5\n41\n42.5\n44.5\n42.5\n41.5\n42.5\n44.5\n42.5\n41.5\n43.5\n41.5\n42.5\n44.5\n41\n43.5\n43\n43.5\n44.5\n44\n42\n43\n43.5\n44\n42.5\n43.5\n41\n41.5\n42.5\n41\n43\n41.5\n43\n45.5\n42\n43.5\n43\n44\n42\n41.5\n41.5\n42\n41.5\n42\n43.5\n41\n42.5\n40.5\n42\n43.5\n42.5\n43\n41.5\n42\n44.5\n45\n42.5\n41.5\n43\n42\n41.5\n42.5\n46\n45\n42.5\n45\n44\n45\n45.5\n41\n41\n42\n42.5\n41\n41.5\n42.5\n42.5\n44\n44.5\n44\n42\n42.5\n41\n42.5\n41.5\n44.5\n41\n40.5\n41\n44\n43\n44\n42.5\n41.5\n41.5\n41.5\n42.5\n43.5\n41.5\n42.5\n43\n44.5\n42\n43\n42.5\n42.5\n43\n41.5\n44\n42\n42.5\n41.5\n41\n42.5\n42.5\n41\n42.5\n43.5'
);
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

const normalPDF = (x: number, mean: number, std: number) => {
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
};

const normalCDF = (x: number, mean: number, std: number) => {
  const z = (x - mean) / std;
  const absZ = Math.abs(z);
  // Abramowitz & Stegun 7.1.26 - Higher precision than previous
  const t = 1.0 / (1.0 + 0.2316419 * absZ);
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const d = 0.3989422804; // 1/sqrt(2pi)
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
  const avgS = validSubgroups.reduce((a, b) => a + b.stdev, 0) / validSubgroups.length;

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

  // Control Limits
  const constants = getStatsConstants(subgroupSize.value);
  const xbarUCL = avgMean + constants.a3 * avgS;
  const xbarLCL = avgMean - constants.a3 * avgS;
  const sUCL = constants.b4 * avgS;
  const sLCL = constants.b3 * avgS;

  // Histogram Bins
  const minVal = Math.min(...numbers, lsl.value) - 1;
  const maxVal = Math.max(...numbers, usl.value) + 1;
  const binCount = 12;
  const binSize = (maxVal - minVal) / binCount;

  const histogramBins = Array.from({ length: binCount }, (_, i) => {
    const start = minVal + i * binSize;
    const end = start + binSize;
    const count = numbers.filter((n) => n >= start && n < end).length;
    const mid = (start + end) / 2;
    return {
      range: mid.toFixed(1),
      count,
      within: normalPDF(mid, meanTotal, stdevWithin) * nTotal * binSize,
      overall: normalPDF(mid, meanTotal, stdevOverall) * nTotal * binSize,
    };
  });

  // Probability Plot
  const sorted = [...numbers].sort((a, b) => a - b);
  const probData = sorted.map((v, i) => {
    const p = (i + 0.5) / nTotal;
    const z = 4.91 * (Math.pow(p, 0.14) - Math.pow(1 - p, 0.14));
    return [v, z];
  });

  // Capability Indices
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

  // Cpm and PPM
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
    sUCL,
    sLCL,
    avgS,
    histogramBins,
    probData,
    numbers,
  };
});

// --- Chart Options ---
const xbarChartOptions = computed(() => {
  if (!results.value) return {};
  const { xbarUCL, xbarLCL, avgMean } = results.value;
  return {
    chart: { type: 'line' as const, toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { width: [3, 1, 1, 1], dashArray: [0, 5, 0, 5], curve: 'straight' as const },
    colors: ['#1e293b', '#ef4444', '#10b981', '#ef4444'],
    xaxis: { labels: { style: { fontSize: '10px' } } },
    yaxis: { labels: { style: { fontSize: '10px' } }, decimalsInFloat: 2 },
    annotations: {
      yaxis: [
        { y: xbarUCL, borderColor: '#ef4444', label: { text: 'UCL' } },
        { y: avgMean, borderColor: '#10b981', label: { text: 'Xbar' } },
        { y: xbarLCL, borderColor: '#ef4444', label: { text: 'LCL' } },
      ],
    },
  };
});

const sChartOptions = computed(() => {
  if (!results.value) return {};
  const { sUCL, sLCL, avgS } = results.value;
  return {
    chart: { type: 'line' as const, toolbar: { show: false } },
    colors: ['#1e293b'],
    xaxis: { labels: { style: { fontSize: '10px' } } },
    yaxis: { labels: { style: { fontSize: '10px' } }, min: 0 },
    annotations: {
      yaxis: [
        { y: sUCL, borderColor: '#ef4444', label: { text: 'UCL' } },
        { y: avgS, borderColor: '#10b981', label: { text: 'Sbar' } },
        { y: sLCL, borderColor: '#ef4444', label: { text: 'LCL' } },
      ],
    },
  };
});

const histChartOptions = computed(() => {
  if (!results.value) return {};
  return {
    chart: { toolbar: { show: false } },
    xaxis: { labels: { style: { fontSize: '10px' } } },
    yaxis: { show: false },
    plotOptions: { bar: { borderRadius: 4 } },
    colors: ['#e2e8f0', '#3b82f6', '#ef4444'],
    stroke: { width: [0, 2, 2], dashArray: [0, 0, 5], curve: 'smooth' as const },
  };
});

const probChartOptions = computed(() => ({
  chart: { type: 'scatter' as const, toolbar: { show: false } },
  xaxis: { type: 'numeric' as const, title: { text: 'Value', style: { fontSize: '10px' } } },
  yaxis: { title: { text: 'Z-score', style: { fontSize: '10px' } }, min: -3, max: 3 },
}));
</script>

<template>
  <div class="space-y-6">
    <!-- Controls -->
    <Card class="border-none shadow-sm">
      <CardContent class="p-6">
        <div class="flex flex-col lg:flex-row justify-between gap-6">
          <div class="flex items-center gap-3">
            <div class="p-3 bg-blue-600 rounded-xl text-white">
              <Calculator :size="24" />
            </div>
            <div>
              <h1 class="font-bold text-xl text-slate-900">{{ t('qa.cpk.title') }}</h1>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {{ t('qa.cpk.subtitle') }}
              </p>
            </div>
          </div>

          <div
            class="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100"
          >
            <div class="flex items-center gap-2 border-r border-slate-200 pr-4">
              <span class="text-[10px] font-bold text-slate-500 uppercase"
                >{{ t('qa.cpk.specs') }}:</span
              >
              <Input
                type="number"
                v-model="lsl"
                class="w-20 h-8 text-xs font-bold"
                placeholder="LSL"
              />
              <span class="text-slate-300">-</span>
              <Input
                type="number"
                v-model="usl"
                class="w-20 h-8 text-xs font-bold"
                placeholder="USL"
              />
            </div>
            <div class="flex items-center gap-2 border-r border-slate-200 pr-4">
              <span class="text-[10px] font-bold text-slate-500 uppercase"
                >{{ t('qa.cpk.subgroup') }}:</span
              >
              <Input
                type="number"
                v-model="subgroupSize"
                class="w-16 h-8 text-xs font-bold"
                :min="1"
              />
            </div>
            <div class="flex items-center gap-2">
              <label
                class="cursor-pointer bg-white border border-slate-200 hover:bg-slate-100 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
              >
                <Upload :size="14" class="text-blue-600" />
                {{ t('qa.cpk.uploadCsv') }}
                <input type="file" accept=".csv" class="hidden" @change="handleFileUpload" />
              </label>
            </div>
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
            <Button
              v-for="col in csvColumns"
              :key="col"
              variant="ghost"
              size="sm"
              :class="[
                'h-7 px-3 rounded-full text-[10px] font-bold transition-all',
                selectedColumn === col
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              ]"
              @click="handleColumnChange(col)"
            >
              {{ col }}
            </Button>
          </div>
        </div>

        <div class="mt-4">
          <Label class="text-[10px] font-bold text-slate-500 uppercase mb-2 block">{{
            t('qa.cpk.dataInput')
          }}</Label>
          <textarea
            v-model="dataInput"
            class="w-full h-24 p-3 text-xs font-mono border rounded-xl focus:ring-2 ring-blue-500 outline-none transition-all resize-none bg-slate-50/50"
            placeholder="Enter values separated by space or newline..."
          ></textarea>
        </div>
      </CardContent>
    </Card>

    <!-- Results Display -->
    <div v-if="results" class="max-w-4xl mx-auto">
      <!-- Capability Stats -->
      <Card class="bg-white border-none shadow-sm flex flex-col overflow-hidden">
        <CardContent class="p-8">
          <div class="flex items-center gap-2 mb-8 pb-6 border-b border-slate-100">
            <div class="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h3 class="font-bold text-lg text-slate-800">{{ t('qa.cpk.stats.title') }}</h3>
          </div>
          <div class="grid grid-cols-2 gap-12">
            <div class="space-y-5">
              <h4 class="text-xs font-black text-slate-300 uppercase italic mb-6">
                {{ t('qa.cpk.stats.within') }}
              </h4>
              <StatItem label="StDev" :value="results.stdevWithin.toFixed(3)" />
              <StatItem label="Cp" :value="results.cp.toFixed(2)" highlight />
              <StatItem
                label="Cpk"
                :value="results.cpk.toFixed(2)"
                highlight
                :color="results.cpk < 1.33 ? 'text-orange-600' : 'text-blue-600'"
              />
              <StatItem label="PPM" :value="results.ppmWithin.toFixed(2)" />
            </div>
            <div class="space-y-5">
              <h4 class="text-xs font-black text-slate-300 uppercase italic mb-6">
                {{ t('qa.cpk.stats.overall') }}
              </h4>
              <StatItem label="StDev" :value="results.stdevOverall.toFixed(3)" />
              <StatItem label="Pp" :value="results.pp.toFixed(2)" highlight />
              <StatItem
                label="Ppk"
                :value="results.ppk.toFixed(2)"
                highlight
                :color="results.ppk < 1.33 ? 'text-orange-600' : 'text-indigo-600'"
              />
              <StatItem label="Cpm" :value="results.cpm.toFixed(2)" highlight />
              <StatItem label="PPM" :value="results.ppmOverall.toFixed(2)" />
            </div>
          </div>
          <div class="mt-8 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase">LSL</span>
              <p class="text-sm font-black text-slate-700 mt-1">{{ lsl }}</p>
            </div>
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase">Target</span>
              <p class="text-sm font-black text-slate-700 mt-1">
                {{ ((lsl + usl) / 2).toFixed(1) }}
              </p>
            </div>
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase">USL</span>
              <p class="text-sm font-black text-slate-700 mt-1">{{ usl }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-300"
    >
      <div class="p-6 bg-slate-50 rounded-full mb-6">
        <BarChart3 :size="64" class="animate-pulse" />
      </div>
      <p class="text-xl font-bold italic">{{ t('qa.cpk.noDataTitle') }}</p>
      <p class="text-sm mt-2">{{ t('qa.cpk.noDataSubtitle') }}</p>
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
</style>
