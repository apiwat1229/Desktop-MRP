<script setup lang="ts">
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { usePermissions } from '@/composables/usePermissions';
import { productionReportsApi, type ProductionReport } from '@/services/productionReports';
import type { ColumnDef } from '@tanstack/vue-table';
import { format } from 'date-fns';
import { Edit2, FileText, Search } from 'lucide-vue-next';
import { computed, h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const { hasPermission, isAdmin } = usePermissions();

const canUpdate = computed(() => isAdmin.value || hasPermission('production:update'));

const reports = ref<ProductionReport[]>([]);
const isLoading = ref(false);

const props = defineProps<{
  searchQuery?: string;
  date?: string; // For backward compatibility
  startDate?: string; // For date range
  endDate?: string; // For date range
}>();

const emit = defineEmits(['edit']);

const isDateRangeMode = computed(() => !!props.startDate || !!props.endDate);

// Standardize dates to YYYY-MM-DD
const startDateStr = computed(() => props.startDate?.split('T')[0] || '');
const endDateStr = computed(() => props.endDate?.split('T')[0] || startDateStr.value);
const singleDateStr = computed(() => props.date?.split('T')[0] || '');

const filteredReports = computed(() => {
  let filtered = reports.value;

  // Filter by date - use range mode or single date mode
  if (isDateRangeMode.value) {
    // Date range mode
    if (startDateStr.value) {
      filtered = filtered.filter((report) => {
        const dateVal =
          report.productionDate instanceof Date
            ? report.productionDate.toISOString()
            : report.productionDate;
        const reportDate = dateVal ? dateVal.split('T')[0] : '';
        return reportDate >= startDateStr.value && reportDate <= endDateStr.value;
      });
    }
  } else {
    // Single date mode
    if (singleDateStr.value) {
      filtered = filtered.filter((report) => {
        const dateVal =
          report.productionDate instanceof Date
            ? report.productionDate.toISOString()
            : report.productionDate;
        const reportDate = dateVal ? dateVal.split('T')[0] : '';
        return reportDate === singleDateStr.value;
      });
    }
  }

  // Filter by search query
  if (props.searchQuery) {
    const q = props.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (report) =>
        report.grade?.toLowerCase().includes(q) || report.baleBagLotNo?.toLowerCase().includes(q)
    );
  }

  return filtered;
});

const getPalletStats = (report: ProductionReport) => {
  return (
    report.rows?.reduce(
      (acc, row) => {
        if (Number(row.weight1) > 0) {
          acc.total++;
          if (row.weight1Status === 'PASS') acc.pass++;
          else if (row.weight1Status === 'FAIL') acc.fail++;
        }
        if (Number(row.weight2) > 0) {
          acc.total++;
          if (row.weight2Status === 'PASS') acc.pass++;
          else if (row.weight2Status === 'FAIL') acc.fail++;
        }
        if (Number(row.weight3) > 0) {
          acc.total++;
          if (row.weight3Status === 'PASS') acc.pass++;
          else if (row.weight3Status === 'FAIL') acc.fail++;
        }
        if (Number(row.weight4) > 0) {
          acc.total++;
          if (row.weight4Status === 'PASS') acc.pass++;
          else if (row.weight4Status === 'FAIL') acc.fail++;
        }
        if (Number(row.weight5) > 0) {
          acc.total++;
          if (row.weight5Status === 'PASS') acc.pass++;
          else if (row.weight5Status === 'FAIL') acc.fail++;
        }
        return acc;
      },
      { total: 0, pass: 0, fail: 0 }
    ) || { total: 0, pass: 0, fail: 0 }
  );
};

const getBaleStats = (report: ProductionReport) => {
  return (
    report.rows?.reduce(
      (acc, row) => {
        const w1 = Number(row.weight1) || 0;
        const w2 = Number(row.weight2) || 0;
        const w3 = Number(row.weight3) || 0;
        const w4 = Number(row.weight4) || 0;
        const w5 = Number(row.weight5) || 0;

        acc.total += w1 + w2 + w3 + w4 + w5;
        if (row.weight1Status === 'PASS') acc.pass += w1;
        else if (row.weight1Status === 'FAIL') acc.fail += w1;

        if (row.weight2Status === 'PASS') acc.pass += w2;
        else if (row.weight2Status === 'FAIL') acc.fail += w2;

        if (row.weight3Status === 'PASS') acc.pass += w3;
        else if (row.weight3Status === 'FAIL') acc.fail += w3;

        if (row.weight4Status === 'PASS') acc.pass += w4;
        else if (row.weight4Status === 'FAIL') acc.fail += w4;

        if (row.weight5Status === 'PASS') acc.pass += w5;
        else if (row.weight5Status === 'FAIL') acc.fail += w5;

        return acc;
      },
      { total: 0, pass: 0, fail: 0 }
    ) || { total: 0, pass: 0, fail: 0 }
  );
};

const fetchReports = async () => {
  isLoading.value = true;
  try {
    reports.value = await productionReportsApi.getAll();
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

const columns: ColumnDef<ProductionReport>[] = [
  {
    accessorKey: 'productionDate',
    header: () => h('div', { class: 'text-center' }, t('production.productionDate')),
    cell: ({ row }) => {
      const date = row.original.productionDate;
      return h(
        'div',
        {
          class: 'text-center font-bold text-primary cursor-pointer hover:underline',
          onClick: () => emit('edit', row.original),
        },
        format(new Date(date), 'dd-MMM-yyyy')
      );
    },
  },
  {
    accessorKey: 'shift',
    header: () => h('div', { class: 'text-center' }, t('production.shift')),
    cell: ({ row }) => h('div', { class: 'text-center' }, row.original.shift),
  },
  {
    accessorKey: 'grade',
    header: () => h('div', { class: 'text-center' }, t('production.grade')),
    cell: ({ row }) => h('div', { class: 'text-center' }, row.original.grade),
  },
  {
    accessorKey: 'baleBagLotNo',
    header: () => h('div', { class: 'text-center' }, t('production.footer.baleBagLotNo')),
    cell: ({ row }) => h('div', { class: 'text-center' }, row.original.baleBagLotNo || '-'),
  },
  {
    id: 'pallets',
    header: () =>
      h('div', { class: 'text-center flex flex-col items-center' }, [
        h('span', 'Pallets'),
        h(
          'span',
          { class: 'text-[9px] text-slate-400 font-medium uppercase' },
          'Pass / Fail (Total)'
        ),
      ]),
    cell: ({ row }) => {
      const stats = getPalletStats(row.original);
      if (stats.fail === 0) {
        return h('div', { class: 'text-center font-bold text-slate-600' }, stats.total);
      }
      return h('div', { class: 'flex items-center justify-center gap-1.5' }, [
        h('span', { class: 'text-red-500 font-bold' }, stats.fail),
        h('span', { class: 'text-slate-400 text-[10px] ml-1' }, `(${stats.total})`),
      ]);
    },
  },
  {
    id: 'bales',
    header: () =>
      h('div', { class: 'text-center flex flex-col items-center' }, [
        h('span', 'Bales'),
        h(
          'span',
          { class: 'text-[9px] text-slate-400 font-medium uppercase' },
          'Pass / Fail (Total)'
        ),
      ]),
    cell: ({ row }) => {
      const stats = getBaleStats(row.original);
      if (stats.fail === 0) {
        return h(
          'div',
          { class: 'text-center font-bold text-slate-600' },
          stats.total.toLocaleString()
        );
      }
      return h('div', { class: 'flex items-center justify-center gap-1.5' }, [
        h('span', { class: 'text-red-500 font-bold' }, stats.fail.toLocaleString()),
        h(
          'span',
          { class: 'text-slate-400 text-[10px] ml-1' },
          `(${stats.total.toLocaleString()})`
        ),
      ]);
    },
  },
  {
    accessorKey: 'status',
    header: () => h('div', { class: 'w-full text-center' }, t('common.status')),
    cell: ({ row }) => {
      const status = row.original.status;
      return h('div', { class: 'w-full flex justify-center' }, [
        h(
          'span',
          {
            class: [
              'px-2 py-1 rounded-full text-xs font-medium',
              status === 'SUBMITTED'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700',
            ],
          },
          status
        ),
      ]);
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'w-full text-center' }, t('common.actions')),
    cell: ({ row }) => {
      const report = row.original;
      const isReadonly = report.status === 'SUBMITTED' || !canUpdate.value;
      return h(
        'div',
        { class: 'w-full flex justify-center gap-2' },
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            onClick: () => emit('edit', report),
          },
          () => (isReadonly ? h(FileText, { class: 'h-4 w-4' }) : h(Edit2, { class: 'h-4 w-4' }))
        )
      );
    },
  },
];

onMounted(fetchReports);
</script>

<template>
  <div>
    <DataTable
      :columns="columns"
      :data="filteredReports"
      :loading="isLoading"
      @row-click="(report) => emit('edit', report)"
    >
      <template #empty>
        <div class="flex flex-col items-center justify-center py-12">
          <div class="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100/50">
            <Search class="h-10 w-10 text-slate-200" />
          </div>
          <h3 class="text-lg font-bold text-slate-700 tracking-tight">
            {{ t('production.history.empty') }}
          </h3>
          <p class="text-slate-400 text-sm font-medium mt-1">
            No reports found for the selected date range.
          </p>
        </div>
      </template>
    </DataTable>
  </div>
</template>
