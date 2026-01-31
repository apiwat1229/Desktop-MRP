<script setup lang="ts">
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import type { ColumnDef } from '@tanstack/vue-table';
import { format } from 'date-fns';
import { Edit, Trash2 } from 'lucide-vue-next';
import { computed, h, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
  searchQuery: {
    type: String,
    default: '',
  },
  selectedDate: {
    type: String,
    default: '',
  },
  activeStatus: {
    type: String,
    default: 'all',
  },
});

const emit = defineEmits(['update:stats']);

const { t } = useI18n();
const router = useRouter();

// State
const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);
const isLoading = ref(false);

// Watch for date changes to refetch
watch(
  () => props.selectedDate,
  (newVal) => {
    if (newVal) fetchBookings();
  }
);

// Fetch Data
const fetchBookings = async () => {
  isLoading.value = true;
  try {
    const [bookingsResponse, typesResponse] = await Promise.all([
      bookingsApi.getAll({ date: props.selectedDate }),
      rubberTypesApi.getAll(),
    ]);
    bookings.value = Array.isArray(bookingsResponse)
      ? bookingsResponse
      : (bookingsResponse as any).data || [];
    rubberTypes.value = typesResponse;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    toast.error(t('truckScale.toast.loadBookingsFailed'));
    bookings.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Modal Logic
const handleRowClick = (row: any) => {
  router.push({
    name: 'UssDetail',
    params: { id: row.originalId },
    query: {
      isTrailer: row.isTrailerPart ? 'true' : 'false',
      partLabel: row.partLabel,
    },
  });
};

// Helper to get Rubber Type Name
const getRubberTypeName = (code: string) => {
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code;
};

// Helper to check if Rubber Type is USS
const isUssType = (val: string) => {
  if (!val) return false;
  const type = rubberTypes.value.find((t) => t.code === val || t.name === val);
  if (type) return type.category === 'USS';
  const upperVal = val.toUpperCase();
  return upperVal.includes('USS');
};

// Processed Data (Split logic)
const processedBookings = computed(() => {
  const result: any[] = [];

  bookings.value.forEach((b) => {
    const isTrailer = ['10 ล้อ พ่วง', '10 ล้อ (พ่วง)'].includes(b.truckType);

    // 1. Main Truck Part
    const hasMainWeight =
      (b.weightIn && b.weightIn > 0) ||
      (b.grossWeight && b.grossWeight > 0) ||
      (b.actualWeight && b.actualWeight > 0) ||
      (b.estimatedWeight && b.estimatedWeight > 0);

    if (isUssType(b.rubberType) && hasMainWeight) {
      const bSamples = b.labSamples?.filter((s: any) => !s.isTrailer) || [];
      const validCpSamples = bSamples.filter((s: any) => s.percentCp > 0);
      const avgCp =
        validCpSamples.length > 0
          ? validCpSamples.reduce((sum: number, s: any) => sum + s.percentCp, 0) /
            validCpSamples.length
          : b.cpAvg || 0;

      const isComplete = (b.weightOut || 0) > 0 && avgCp > 0;
      const gross = Math.max(0, (b.weightIn || 0) - (b.weightOut || 0));
      const drc = b.drcActual || 0;
      const netWeight = drc > 0 ? Math.round(gross * (drc / 100)) : 0;

      result.push({
        ...b,
        id: b.id + '-main',
        originalId: b.id,
        isTrailerPart: false,
        partLabel: t('truckScale.mainTruck') || 'Main Truck',
        displayRubberType: getRubberTypeName(b.rubberType),
        displayRubberSource: b.rubberSource,
        displayWeightIn: b.weightIn || b.grossWeight || b.actualWeight || 0,
        displayWeightOut: b.weightOut || 0,
        displayNetWeight: netWeight,
        moisture: b.moisture ? b.moisture.toFixed(1) : '-',
        drcEst: b.drcEst ? b.drcEst.toFixed(1) : '-',
        drcRequested: b.drcRequested ? b.drcRequested.toFixed(1) : '-',
        drcActual: b.drcActual ? b.drcActual.toFixed(1) : '-',
        cpAvg: avgCp > 0 ? avgCp.toFixed(2) : '-',
        lotNo: b.lotNo || '-',
        isComplete,
      });
    }

    // 2. Trailer Part
    const hasTrailerWeight =
      (b.trailerWeightIn && b.trailerWeightIn > 0) ||
      (b.trailerGrossWeight && b.trailerGrossWeight > 0) ||
      (b.trailerActualWeight && b.trailerActualWeight > 0) ||
      (b.trailerEstimatedWeight && b.trailerEstimatedWeight > 0);

    if (isTrailer && hasTrailerWeight && isUssType(b.trailerRubberType)) {
      const bSamples = b.labSamples?.filter((s: any) => s.isTrailer) || [];
      const validCpSamples = bSamples.filter((s: any) => s.percentCp > 0);
      const avgCp =
        validCpSamples.length > 0
          ? validCpSamples.reduce((sum: number, s: any) => sum + s.percentCp, 0) /
            validCpSamples.length
          : b.trailerCpAvg || 0;

      const isComplete = (b.trailerWeightOut || 0) > 0 && avgCp > 0;
      const gross = Math.max(0, (b.trailerWeightIn || 0) - (b.trailerWeightOut || 0));
      const drc = b.trailerDrcActual || 0;
      const netWeight = drc > 0 ? Math.round(gross * (drc / 100)) : 0;

      result.push({
        ...b,
        id: b.id + '-trailer',
        originalId: b.id,
        isTrailerPart: true,
        partLabel: t('truckScale.trailer') || 'Trailer',
        displayRubberType: getRubberTypeName(b.trailerRubberType),
        displayRubberSource: b.trailerRubberSource || '-',
        displayWeightIn: b.trailerWeightIn || b.trailerGrossWeight || b.trailerActualWeight || 0,
        displayWeightOut: b.trailerWeightOut || 0,
        displayNetWeight: netWeight,
        moisture: b.trailerMoisture ? b.trailerMoisture.toFixed(1) : '-',
        drcEst: b.trailerDrcEst ? b.trailerDrcEst.toFixed(1) : '-',
        drcRequested: b.trailerDrcRequested ? b.trailerDrcRequested.toFixed(1) : '-',
        drcActual: b.trailerDrcActual ? b.trailerDrcActual.toFixed(1) : '-',
        cpAvg: avgCp > 0 ? avgCp.toFixed(2) : '-',
        lotNo: b.trailerLotNo || '2251226-' + b.queueNo + '/2',
        isComplete,
      });
    }
  });

  let data = result;

  if (props.activeStatus === 'complete') {
    data = data.filter((item) => item.isComplete);
  } else if (props.activeStatus === 'incomplete') {
    data = data.filter((item) => !item.isComplete);
  }

  if (props.searchQuery) {
    const q = props.searchQuery.toLowerCase();
    data = data.filter(
      (item) =>
        item.bookingCode?.toLowerCase().includes(q) ||
        item.supplierName?.toLowerCase().includes(q) ||
        item.truckRegister?.toLowerCase().includes(q)
    );
  }

  if (props.selectedDate) {
    data = data.filter((item) => {
      const itemDate = item.date ? item.date.split('T')[0] : '';
      return itemDate === props.selectedDate;
    });
  }

  return data;
});

const stats = computed(() => {
  const total = processedBookings.value.length;
  const complete = processedBookings.value.filter((i) => i.isComplete).length;
  const incomplete = total - complete;
  const grossWeight = processedBookings.value.reduce(
    (sum, i) => sum + Math.max(0, (i.weightIn || 0) - (i.weightOut || 0)),
    0
  );
  const netWeight = processedBookings.value.reduce((sum, i) => sum + (i.displayNetWeight || 0), 0);

  return { total, complete, incomplete, grossWeight, netWeight };
});

// Emit stats to parent
watch(
  stats,
  (newStats) => {
    emit('update:stats', newStats);
  },
  { immediate: true, deep: true }
);

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'lotNo',
    header: () => t('uss.lotNumber'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-foreground' }, row.original.lotNo),
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          format(new Date(row.original.date), 'dd MMM yyyy')
        ),
      ]),
  },
  {
    accessorKey: 'supplierName',
    header: () => t('uss.supplier'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold' }, row.original.supplierCode),
        h('span', { class: 'text-[10px] text-muted-foreground' }, row.original.supplierName),
      ]),
  },
  {
    accessorKey: 'totalPallets',
    header: () => h('div', { class: 'text-center' }, t('uss.totalPallets')),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-center font-medium' },
        (row.original.subBookings?.length || 0).toString()
      ),
  },
  {
    accessorKey: 'grossPlusPallets',
    header: () => h('div', { class: 'text-center' }, t('uss.grossPlusPalletsWeight')),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-center font-medium' },
        (row.original.displayWeightIn || 0).toLocaleString()
      ),
  },
  {
    accessorKey: 'grossWeight',
    header: () =>
      h('div', { class: 'text-center' }, t('truckScale.stats.inOut') || 'Weight In / Out'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-center font-medium' },
        (row.original.displayWeightOut || 0).toLocaleString()
      ),
  },
  {
    accessorKey: 'netWeight',
    header: () => h('div', { class: 'text-center' }, t('uss.netWeight')),
    cell: ({ row }) => {
      const val = row.original.displayNetWeight;
      if (!val || val === 0) return h('div', { class: 'text-center font-bold' }, '-');
      return h('div', { class: 'text-center font-bold' }, val.toLocaleString());
    },
  },

  {
    accessorKey: 'drcEst',
    header: () => h('div', { class: 'text-center' }, t('uss.drcEst')),
    cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.original.drcEst),
  },
  {
    accessorKey: 'drcActual',
    header: () => h('div', { class: 'text-center' }, t('uss.drcActual')),
    cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.original.drcActual),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-center' }, t('uss.action')),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center justify-center gap-2' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            onClick: (e: any) => {
              e.stopPropagation();
              handleRowClick(row.original);
            },
          },
          () => h(Edit, { class: 'w-4 h-4 text-muted-foreground' })
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            onClick: (e: any) => {
              e.stopPropagation();
            },
          },
          () => h(Trash2, { class: 'w-4 h-4 text-destructive' })
        ),
      ]);
    },
  },
];

onMounted(() => {
  fetchBookings();
});
</script>

<template>
  <div class="h-full flex flex-col space-y-6" :class="{ 'p-6': !embedded }">
    <!-- Header Controls Removed (Moved to parent) -->

    <!-- Data Table -->
    <div class="flex-1 overflow-hidden">
      <DataTable
        :columns="columns"
        :data="processedBookings"
        :loading="isLoading"
        @row-click="handleRowClick"
      />
    </div>
  </div>
</template>
