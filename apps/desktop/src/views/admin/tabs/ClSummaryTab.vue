<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import type { ColumnDef } from '@tanstack/vue-table';
import { computed, h, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const router = useRouter();

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

const calculateGrade = (avg: number) => {
  if (!avg || avg === 0) return '-';
  if (avg < 20) return 'D';
  if (avg < 35) return 'C';
  if (avg < 47) return 'B';
  if (avg < 60) return 'A';
  return 'AA';
};

const processedBookings = computed(() => {
  if (!bookings.value) return [];

  return bookings.value
    .filter((b) => {
      if (props.searchQuery) {
        const q = props.searchQuery.toLowerCase();
        return (
          b.bookingCode?.toLowerCase().includes(q) ||
          b.supplierName?.toLowerCase().includes(q) ||
          b.truckRegister?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .map((b) => {
      const parts: any[] = [];
      const mainSamples = b.labSamples?.filter((s: any) => !s.isTrailer) || [];

      if (mainSamples.length > 0) {
        const validPriMain = mainSamples.filter((s: any) => s.pri && s.pri > 0);
        const avgPriMain =
          validPriMain.length > 0
            ? validPriMain.reduce((sum: number, s: any) => sum + s.pri, 0) / validPriMain.length
            : 0;

        parts.push({
          ...b,
          id: b.id + '-main',
          originalId: b.id,
          isTrailerPart: false,
          partLabel: t('qa.labels.mainTruck'),
          displayRubberType: getRubberTypeName(b.rubberType),
          displayWeight: (b.weightIn || 0) - (b.weightOut || 0),
          avgPri: avgPriMain,
          displayGrade: calculateGrade(avgPriMain),
        });
      }

      const trailerSamples = b.labSamples?.filter((s: any) => s.isTrailer) || [];
      if (trailerSamples.length > 0) {
        const validPriTrailer = trailerSamples.filter((s: any) => s.pri && s.pri > 0);
        const avgPriTrailer =
          validPriTrailer.length > 0
            ? validPriTrailer.reduce((sum: number, s: any) => sum + s.pri, 0) /
              validPriTrailer.length
            : 0;

        parts.push({
          ...b,
          id: b.id + '-trailer',
          originalId: b.id,
          isTrailerPart: true,
          partLabel: t('qa.labels.trailer'),
          displayRubberType: getRubberTypeName(b.trailerRubberType || b.rubberType),
          displayWeight: (b.trailerWeightIn || 0) - (b.trailerWeightOut || 0),
          avgPri: avgPriTrailer,
          displayGrade: calculateGrade(avgPriTrailer),
        });
      }
      return parts;
    })
    .flat();
});

watch(
  processedBookings,
  (newVal) => {
    emit('update:stats', {
      total: newVal.length,
      complete: newVal.length,
      incomplete: 0,
    });
  },
  { immediate: true }
);

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'date',
    header: () => t('qa.columns.date'),
    cell: ({ row }) =>
      new Date(row.original.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
  },
  {
    accessorKey: 'lotNo',
    header: () => t('qa.columns.lotNumber'),
    cell: ({ row }) => h('span', { class: 'font-bold' }, row.original.lotNo || '-'),
  },
  {
    accessorKey: 'supplierName',
    header: () => t('qa.columns.supplier'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium' }, row.original.supplierName),
        h('span', { class: 'text-xs text-muted-foreground' }, row.original.supplierCode),
      ]),
  },
  {
    accessorKey: 'truckRegister',
    header: () => t('qa.columns.truck'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium' }, row.original.truckRegister),
        h('span', { class: 'text-xs text-muted-foreground' }, row.original.partLabel),
      ]),
  },
  {
    accessorKey: 'displayWeight',
    header: () => h('div', { class: 'text-right' }, t('qa.columns.weight')),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-right font-medium' },
        (row.original.displayWeight || 0).toLocaleString() + ' kg'
      ),
  },
  {
    accessorKey: 'avgPri',
    header: () => h('div', { class: 'text-center' }, 'Avg PRI'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-center' },
        row.original.avgPri > 0 ? row.original.avgPri.toFixed(2) : '-'
      ),
  },
  {
    accessorKey: 'displayGrade',
    header: () => h('div', { class: 'text-center' }, t('qa.columns.grade')),
    cell: ({ row }) => {
      const grade = row.original.displayGrade;
      let variant: any = 'outline';
      if (['AA', 'A'].includes(grade)) variant = 'default';
      else if (grade === 'B') variant = 'secondary';
      return h('div', { class: 'text-center' }, [
        h(Badge, { variant, class: 'px-3 font-bold' }, () => grade),
      ]);
    },
  },
];

const handleRowClick = (row: any) => {
  router.push({
    name: 'CuplumpDetail',
    params: { id: row.originalId },
    query: { isTrailer: row.isTrailerPart ? 'true' : 'false' },
  });
};
</script>

<template>
  <div class="space-y-4">
    <DataTable
      :columns="columns"
      :data="processedBookings"
      :loading="isLoading"
      @row-click="handleRowClick"
    />
  </div>
</template>
