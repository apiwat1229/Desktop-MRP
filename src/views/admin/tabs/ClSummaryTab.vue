<script setup lang="ts">
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import { BeakerIcon } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

const props = defineProps({
  searchQuery: { type: String, default: '' },
  date: { type: String, default: '' },
  statusFilter: { type: String, default: 'ALL' },
});

const emit = defineEmits(['update:stats']);

const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);
const isLoading = ref(false);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [bookingsRes, typesRes] = await Promise.all([
      bookingsApi.getAll({ date: props.date }),
      rubberTypesApi.getAll(),
    ]);
    bookings.value = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes as any).data || [];
    rubberTypes.value = typesRes;
  } catch (error) {
    console.error('Failed to fetch summary bookings:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchData);
watch(() => props.date, fetchData);

const getRubberTypeName = (code: string) => {
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code;
};

const isCuplumpType = (val: string) => {
  if (!val) return false;
  const type = rubberTypes.value.find((t) => t.code === val || t.name === val);
  if (type) return type.category === 'Cuplump';
  const upperVal = val.toUpperCase();
  return upperVal.includes('CL') || upperVal.includes('CUPLUMP');
};

// --- Calculation Logic Ported from ClLabDetail.vue ---

const pf = (v: any) => parseFloat(v?.toString()) || null;
const formatNum = (val: number | null | undefined, digits = 2) => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return val.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const calculateMetrics = (s: any, b: number) => {
  const bb = pf(s['beforeBaking' + b]);
  const ad = pf(s['afterDryerB' + b]);
  const bl = pf(s['beforeLabDryerB' + b]);
  const al = pf(s['afterLabDryerB' + b]);

  const drc = bb && ad ? (ad / bb) * 100 : 0;
  const moisture = bb && ad ? ((bb - ad) / bb) * 100 : 0;

  // DRC Dry factor derived from user examples (66.70/75.00 = 0.8893)
  const drcDry = drc * 0.8893;

  const moistureFactor = bl && al && bl > 0 ? al / bl : 0;
  const recalDrc = drcDry * moistureFactor;

  return { drc, moisture, drcDry, moistureFactor, recalDrc, hasData: bb && ad };
};

const getSampleSummary = (s: any) => {
  // Calculate medians for the sample header
  const baskets = [1, 2, 3];
  const metrics = baskets.map((b) => calculateMetrics(s, b));

  // Filter valid data
  const drcs = metrics.filter((m) => m.drc > 0).map((m) => m.drc);
  const recals = metrics.filter((m) => m.recalDrc > 0).map((m) => m.recalDrc);
  const moistures = metrics.filter((m) => m.moisture >= 0 && m.hasData).map((m) => m.moisture); // Allow 0 moisture?

  const getMedian = (arr: number[]) => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const medianDrc = getMedian(drcs);
  const medianRecal = getMedian(recals);
  const medianMoisture = getMedian(moistures);

  return {
    medianDrc,
    medianRecal,
    medianMoisture,
  };
};

const processedBookingGroups = computed(() => {
  if (!bookings.value) return [];

  let filtered = bookings.value;

  if (props.searchQuery) {
    const q = props.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.bookingCode?.toLowerCase().includes(q) ||
        b.supplierName?.toLowerCase().includes(q) ||
        b.truckRegister?.toLowerCase().includes(q) ||
        b.lotNo?.toLowerCase().includes(q)
    );
  }

  // Filter for Cuplump only
  filtered = filtered.filter((b) => isCuplumpType(b.rubberType));

  return filtered.map((b) => {
    // Find Grade
    let avgPri = 0;
    const mainSamples = b.labSamples?.filter((s: any) => !s.isTrailer) || [];
    const validPri = mainSamples.filter((s: any) => s.pri > 0);
    if (validPri.length > 0) {
      avgPri = validPri.reduce((a: number, s: any) => a + s.pri, 0) / validPri.length;
    }

    let grade = '-';
    if (avgPri > 0) {
      if (avgPri < 20) grade = 'D';
      else if (avgPri < 35) grade = 'C';
      else if (avgPri < 47) grade = 'B';
      else if (avgPri < 60) grade = 'A';
      else grade = 'AA';
    }

    const samples =
      b.labSamples
        ?.filter((s: any) => !s.isTrailer)
        .map((s: any, idx: number) => {
          const summary = getSampleSummary(s);
          return {
            ...s,
            index: idx + 1,
            summary,
          };
        }) || [];

    return {
      ...b,
      displayRubberType: getRubberTypeName(b.rubberType),
      displayWeight: (b.weightIn || 0) - (b.weightOut || 0),
      grade,
      avgPri,
      samples,
    };
  });
});

watch(
  processedBookingGroups,
  (newVal) => {
    emit('update:stats', {
      total: newVal.length,
      complete: newVal.length,
      incomplete: 0,
    });
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-6 pb-20">
    <div v-if="isLoading" class="flex justify-center py-10">
      <div
        class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"
      ></div>
    </div>

    <div
      v-else-if="processedBookingGroups.length === 0"
      class="text-center py-10 text-muted-foreground"
    >
      No data found for this date.
    </div>

    <!-- Booking Card Loop -->
    <div
      v-else
      v-for="booking in processedBookingGroups"
      :key="booking.id"
      class="bg-white rounded-xl shadow-sm border overflow-hidden"
    >
      <!-- Booking Header -->
      <div class="p-4 border-b bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
        <!-- Date -->
        <div class="flex flex-col">
          <span class="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest mb-0.5"
            >Date</span
          >
          <span class="text-sm font-bold text-gray-900">
            {{
              new Date(booking.date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            }}
          </span>
        </div>

        <!-- Lot No -->
        <div class="flex flex-col">
          <span class="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest mb-0.5"
            >Lot Number</span
          >
          <div class="flex items-baseline gap-2">
            <span class="text-lg font-black text-emerald-600 tracking-tight">{{
              booking.lotNo || '-'
            }}</span>
            <!-- If queue is needed -->
            <!-- <span class="text-xs font-bold text-gray-400">{{ booking.queueNo }}</span> -->
          </div>
        </div>

        <!-- Supplier -->
        <div class="flex flex-col">
          <span class="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest mb-0.5"
            >Supplier</span
          >
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-bold text-gray-900">{{ booking.supplierName }}</span>
            <span class="text-xs font-medium text-gray-400">{{ booking.supplierCode }}</span>
          </div>
        </div>

        <!-- Truck -->
        <!-- Only show if space permits, simplified version -->
        <!-- <div class="flex flex-col hidden xl:flex">
                 <span class="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Truck</span>
                 <span class="text-sm font-bold text-gray-900">{{ booking.truckRegister }}</span>
             </div> -->

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Net Weight -->
        <div class="flex flex-col items-end">
          <span class="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest mb-0.5"
            >Net Weight</span
          >
          <div class="flex items-baseline gap-1">
            <span class="text-lg font-black text-gray-900">{{
              booking.displayWeight.toLocaleString()
            }}</span>
            <span class="text-xs font-bold text-gray-500">kg.</span>
          </div>
        </div>

        <!-- Rubber Type Badge -->
        <div
          class="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100 flex flex-col items-center"
        >
          <span class="text-[0.6rem] uppercase opacity-70 mb-0.5">Regular CL</span>
          <span>{{ booking.displayRubberType }}</span>
        </div>

        <!-- Grade Badge -->
        <div class="flex flex-col items-center border rounded-lg px-3 py-1 bg-white">
          <span class="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider mb-0.5"
            >Grade</span
          >
          <span
            class="text-xl font-black"
            :class="{
              'text-emerald-500': ['AA', 'A'].includes(booking.grade),
              'text-yellow-500': booking.grade === 'B',
              'text-orange-500': booking.grade === 'C',
              'text-red-500': booking.grade === 'D',
              'text-gray-300': booking.grade === '-',
            }"
            >{{ booking.grade }}</span
          >
        </div>
      </div>

      <!-- Samples Grid -->
      <div class="p-4 bg-slate-50 border-t">
        <!-- Responsive Grid instead of Scroll -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <!-- Sample Card Loop -->
          <div
            v-for="sample in booking.samples"
            :key="sample.id"
            class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col"
          >
            <!-- Blue Header -->
            <div class="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <BeakerIcon class="w-6 h-6" />
                <div class="font-black text-lg tracking-wide uppercase">
                  SAMPLE {{ sample.index }}
                </div>
              </div>
              <div class="flex items- divide-x divide-blue-400/50">
                <div class="flex flex-col items-end px-4">
                  <span class="opacity-70 font-bold text-[0.6rem] uppercase tracking-wider mb-0.5"
                    >Moisture Median</span
                  >
                  <span class="font-black text-xl leading-none"
                    >{{ formatNum(sample.summary.medianMoisture, 2) }}%</span
                  >
                </div>
                <div class="flex flex-col items-end px-4">
                  <span class="opacity-70 font-bold text-[0.6rem] uppercase tracking-wider mb-0.5"
                    >DRC Median</span
                  >
                  <span class="font-black text-xl leading-none"
                    >{{ formatNum(sample.summary.medianDrc, 1) }}%</span
                  >
                </div>
                <div class="flex flex-col items-end pl-4">
                  <span class="opacity-70 font-bold text-[0.6rem] uppercase tracking-wider mb-0.5"
                    >Recal Median</span
                  >
                  <span class="font-black text-xl leading-none"
                    >{{ formatNum(sample.summary.medianRecal, 1) }}%</span
                  >
                </div>
              </div>
            </div>

            <!-- Rows for Baskets -->
            <div class="p-3 space-y-3 flex-1">
              <div
                v-for="b in [1, 2, 3]"
                :key="b"
                class="text-xs bg-slate-50 border border-slate-100 rounded-md p-2 relative overflow-hidden"
              >
                <!-- Large Background Number -->
                <div
                  class="absolute top-1/2 -translate-y-1/2 left-4 text-[6rem] font-black text-slate-200/50 pointer-events-none select-none z-0"
                >
                  {{ b }}
                </div>

                <!-- Basket Row Data -->
                <div class="grid grid-cols-3 gap-x-4 gap-y-1 relative z-10">
                  <!-- Column 1: Press & Weights -->
                  <div class="space-y-1">
                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase"
                        >Before Press</span
                      >
                      <span class="font-semibold text-slate-700">{{
                        sample['beforePress'] || '-'
                      }}</span>
                    </div>
                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase"
                        >After Press</span
                      >
                      <span class="font-semibold text-slate-700">{{
                        sample['afterPress'] || '-'
                      }}</span>
                    </div>
                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase">Basket</span>
                      <span class="font-semibold text-slate-700">{{
                        sample.basketWeight || '1.4'
                      }}</span>
                    </div>
                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase"
                        >Before Dryer</span
                      >
                      <span class="font-bold text-orange-600">{{
                        sample['beforeBaking' + b] || '-'
                      }}</span>
                    </div>
                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase"
                        >After Dryer</span
                      >
                      <span class="font-bold text-orange-600">{{
                        sample['afterDryerB' + b] || '-'
                      }}</span>
                    </div>
                  </div>

                  <!-- Column 2: DRC Metrics -->
                  <div class="space-y-1">
                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase"
                        >DRC After Baking</span
                      >
                      <span class="font-bold text-blue-600"
                        >{{ formatNum(calculateMetrics(sample, b).drc, 2) }}%</span
                      >
                    </div>

                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase"
                        >DRC Median</span
                      >
                      <span class="font-bold text-blue-600"
                        >{{ formatNum(sample.summary.medianDrc, 2) }}%</span
                      >
                    </div>

                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase"
                        >Recal DRC</span
                      >
                      <span class="font-bold text-indigo-600"
                        >{{ formatNum(calculateMetrics(sample, b).recalDrc, 2) }}%</span
                      >
                    </div>
                  </div>

                  <!-- Column 3: Estimates & Dry -->
                  <div class="space-y-1">
                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase">DRC Est.</span>
                      <span class="font-bold text-slate-500"
                        >{{ formatNum(sample.percentCp, 0) }}%</span
                      >
                    </div>

                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase">DRC</span>
                      <span class="font-bold text-blue-900"
                        >{{ formatNum(calculateMetrics(sample, b).drc, 2) }}%</span
                      >
                    </div>

                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase">DRC Dry</span>
                      <span class="font-bold text-violet-600"
                        >{{ formatNum(calculateMetrics(sample, b).drcDry, 2) }}%</span
                      >
                    </div>

                    <div class="flex justify-between items-baseline">
                      <span class="text-slate-400 font-bold text-[0.6rem] uppercase"
                        >Recal DRC</span
                      >
                      <span class="font-bold text-emerald-500"
                        >{{ formatNum(calculateMetrics(sample, b).recalDrc, 2) }}%</span
                      >
                    </div>
                  </div>

                  <!-- Footer Row (Spanning) -->
                  <div
                    class="col-span-3 pt-1 mt-1 border-t border-dashed border-slate-200 flex justify-between gap-2 overflow-hidden"
                  >
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[0.55rem] font-bold text-slate-400 uppercase"
                        >Difference</span
                      >
                      <span class="font-bold text-red-500 text-[0.7rem]">{{
                        formatNum(
                          calculateMetrics(sample, b).recalDrc -
                            (parseFloat(sample.percentCp) || 0),
                          1
                        )
                      }}</span>
                    </div>

                    <div class="flex flex-col gap-0.5">
                      <span class="text-[0.55rem] font-bold text-slate-400 uppercase"
                        >Moisture %</span
                      >
                      <span class="font-bold text-orange-500 text-[0.7rem]"
                        >{{ formatNum(calculateMetrics(sample, b).moisture, 2) }}%</span
                      >
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[0.55rem] font-bold text-slate-400 uppercase"
                        >Moisture Factor</span
                      >
                      <span class="font-bold text-orange-400 text-[0.7rem]"
                        >{{
                          formatNum((calculateMetrics(sample, b).moistureFactor || 0) * 100, 2)
                        }}%</span
                      >
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[0.55rem] font-bold text-slate-400 uppercase"
                        >Before Lab Dryer</span
                      >
                      <span class="font-bold text-blue-500 text-[0.7rem]">{{
                        formatNum(sample['beforeLabDryerB' + b], 4)
                      }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[0.55rem] font-bold text-slate-400 uppercase"
                        >After Lab Dryer</span
                      >
                      <span class="font-bold text-blue-500 text-[0.7rem]">{{
                        formatNum(sample['afterLabDryerB' + b], 4)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
