<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import api from '@/services/api';
import type { ColumnDef } from '@tanstack/vue-table';
import { format } from 'date-fns';
import { Edit, FileText, Loader2, Plus, Printer, RefreshCw } from 'lucide-vue-next';
import { computed, h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import RawMaterialPlanViewModal from './RawMaterialPlanViewModal.vue';

const { t } = useI18n();
const props = defineProps<{
  searchQuery?: string;
  date?: any; // For backward compatibility
  startDate?: string; // For date range
  endDate?: string; // For date range
}>();

const emit = defineEmits<{
  (e: 'edit', plan: any): void;
  (e: 'create'): void;
}>();

// Data states
const plans = ref<any[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Modal state
const isViewModalOpen = ref(false);
const selectedPlanId = ref<string | null>(null);
const isAutoPrint = ref(false);
const processingId = ref<string | null>(null);

const openViewModal = (id: string, autoPrint = false) => {
  if (processingId.value) return; // Prevent multiple clicks

  selectedPlanId.value = id;
  isAutoPrint.value = autoPrint;
  if (autoPrint) {
    processingId.value = id;
  }
  isViewModalOpen.value = true;
};

const handleModalClose = (val: boolean) => {
  isViewModalOpen.value = val;
  if (!val) {
    // Reset processing state when modal closes (print finished)
    // Small delay to ensure smoother UI transition
    setTimeout(() => {
      processingId.value = null;
    }, 300);
  }
};

const fetchPlans = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await api.get('/raw-material-plans');
    plans.value = response.data;
  } catch (err: any) {
    console.error('Failed to fetch plans:', err);
    error.value = 'Failed to load plans. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchPlans();
});

const formatDate = (date: string | Date) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd-MMM-yy');
  } catch (e) {
    return date;
  }
};

const isDateRangeMode = computed(() => !!props.startDate || !!props.endDate);

const filteredPlans = computed(() => {
  let filtered = plans.value;

  // Filter by date - use range mode or single date mode
  if (isDateRangeMode.value) {
    // Date range mode
    if (props.startDate) {
      const startDateStr = props.startDate.split('T')[0];
      const endDateStr = props.endDate ? props.endDate.split('T')[0] : startDateStr;
      filtered = filtered.filter((plan) => {
        const rawDate = plan.planDate || plan.issuedDate;
        const planDate = rawDate ? rawDate.split('T')[0] : '';
        return planDate >= startDateStr && planDate <= endDateStr;
      });
    }
  } else {
    // Single date mode (backward compatibility)
    if (props.date) {
      const targetDate =
        typeof props.date === 'string'
          ? props.date.split('T')[0]
          : props.date.toString().split('T')[0];
      filtered = filtered.filter((plan) => {
        const rawDate = plan.planDate || plan.issuedDate;
        const planDate = rawDate ? rawDate.split('T')[0] : '';
        return planDate === targetDate;
      });
    }
  }

  // Filter by search query
  if (props.searchQuery) {
    const q = props.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.planNo.toLowerCase().includes(q) ||
        p.refProductionNo?.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        p.creator?.toLowerCase().includes(q) ||
        p.revisionNo?.toLowerCase().includes(q)
    );
  }

  return filtered;
});

const stats = computed(() => ({
  total: filteredPlans.value.length,
  approved: filteredPlans.value.filter((p) => p.status === 'APPROVED').length,
  draft: filteredPlans.value.filter((p) => p.status === 'DRAFT').length,
}));

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'default';
    case 'CLOSED':
      return 'secondary';
    case 'DRAFT':
      return 'outline';
    default:
      return 'outline';
  }
};

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'planDate',
    header: () =>
      h(
        'div',
        { class: 'w-28 font-black text-slate-700 uppercase tracking-tighter text-[10px]' },
        'Date'
      ),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'font-bold text-slate-700' },
        String(formatDate(row.original.planDate || row.original.issuedDate))
      ),
  },
  {
    accessorKey: 'planNo',
    header: () =>
      h(
        'div',
        { class: 'w-72 font-black text-slate-700 uppercase tracking-tighter text-[10px]' },
        'Plan No.'
      ),
    cell: ({ row }) =>
      h(
        'span',
        {
          class: 'font-bold text-primary cursor-pointer hover:underline',
          onClick: () => openViewModal(row.original.id, false),
        },
        row.original.planNo
      ),
  },
  {
    accessorKey: 'revisionNo',
    header: () =>
      h(
        'div',
        { class: 'w-16 font-black text-slate-700 uppercase tracking-tighter text-[10px]' },
        'Revision'
      ),
    cell: ({ row }) => h('div', { class: 'text-center font-mono' }, row.original.revisionNo),
  },
  {
    accessorKey: 'refProductionNo',
    header: () =>
      h(
        'div',
        { class: 'font-black text-slate-700 uppercase tracking-tighter text-[10px]' },
        'Reference Production'
      ),
    cell: ({ row }) => row.original.refProductionNo,
  },
  {
    accessorKey: 'creator',
    header: () =>
      h(
        'div',
        { class: 'font-black text-slate-700 uppercase tracking-tighter text-[10px]' },
        'Created By'
      ),
    cell: ({ row }) => h('div', { class: 'text-muted-foreground' }, row.original.creator),
  },
  {
    accessorKey: 'status',
    header: () =>
      h(
        'div',
        {
          class:
            'w-24 font-black text-slate-700 uppercase tracking-tighter text-[10px] text-center',
        },
        'Status'
      ),
    cell: ({ row }) => {
      const status = row.original.status;
      return h('div', { class: 'text-center' }, [
        h(
          Badge,
          {
            variant: getStatusVariant(status) as any,
            class: 'rounded-full px-3 text-[9px] font-black uppercase tracking-widest',
          },
          () => status
        ),
      ]);
    },
  },
  {
    id: 'actions',
    header: () =>
      h(
        'div',
        {
          class: 'w-32 font-black text-slate-700 uppercase tracking-tighter text-[10px] text-right',
        },
        'Actions'
      ),
    cell: ({ row }) => {
      const plan = row.original;
      return h('div', { class: 'flex items-center justify-end gap-1' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class:
              'h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors',
            onClick: () => openViewModal(plan.id, false),
            title: 'View Details',
          },
          () => h(FileText, { class: 'w-4 h-4' })
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class:
              'h-8 w-8 text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors',
            onClick: () => emit('edit', plan),
            title: 'Edit Plan',
          },
          () => h(Edit, { class: 'w-4 h-4' })
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class:
              'h-8 w-8 text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors',
            disabled: !!processingId.value,
            onClick: () => openViewModal(plan.id, true),
            title: 'Print Plan',
          },
          () =>
            processingId.value === plan.id
              ? h(Loader2, { class: 'w-4 h-4 animate-spin text-primary' })
              : h(Printer, { class: 'w-4 h-4' })
        ),
      ]);
    },
  },
];
</script>

<template>
  <div class="space-y-6">
    <!-- Premium Stats Card with NEW PLAN button -->
    <div
      class="rounded-xl border bg-white shadow-sm p-4 px-6 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6"
    >
      <!-- Stats Section -->
      <div class="flex items-center justify-start gap-12 relative z-10 flex-1">
        <div class="text-center group/stat">
          <span
            class="block text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/stat:text-primary transition-colors"
            >TOTAL PLANS</span
          >
          <span class="text-xl font-black text-slate-900 tabular-nums">{{ stats.total }}</span>
        </div>
        <div class="text-center group/stat">
          <span
            class="block text-[0.6rem] font-black text-emerald-500 uppercase tracking-widest mb-1 group-hover/stat:text-emerald-600 transition-colors"
            >APPROVED</span
          >
          <span class="text-xl font-black text-emerald-600 tabular-nums">{{ stats.approved }}</span>
        </div>
        <div class="text-center group/stat">
          <span
            class="block text-[0.6rem] font-black text-amber-500 uppercase tracking-widest mb-1 group-hover/stat:text-amber-600 transition-colors"
            >DRAFT</span
          >
          <span class="text-xl font-black text-amber-600 tabular-nums">{{ stats.draft }}</span>
        </div>
      </div>

      <!-- Action Button -->
      <div class="relative z-10">
        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            @click="fetchPlans"
            :disabled="isLoading"
            class="h-10 gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-all rounded-xl"
          >
            <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-4 h-4" />
            {{ t('common.refresh') || 'Refresh' }}
          </Button>

          <Button
            @click="emit('create')"
            class="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-primary/20 shadow-lg px-6 h-10 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
          >
            <Plus class="w-4 h-4" />
            {{ t('qa.tabs.rawMaterialPlanCreate') }}
          </Button>
        </div>
      </div>

      <!-- Decorative Background Icon -->
      <FileText
        class="absolute -right-8 -bottom-8 w-48 h-48 text-slate-100/50 -rotate-12 pointer-events-none"
      />
    </div>

    <!-- Raw Material Plans DataTable -->
    <DataTable
      :columns="columns"
      :data="filteredPlans"
      :loading="isLoading"
      @row-click="(plan) => openViewModal(plan.id, false)"
    >
      <template #empty>
        <div class="flex flex-col items-center justify-center py-20">
          <div class="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100/50">
            <FileText class="h-10 w-10 text-slate-200" />
          </div>
          <h3 class="text-lg font-bold text-slate-700 tracking-tight">
            {{ t('qa.tabs.planList') }}
          </h3>
          <p class="text-slate-400 text-sm font-medium mt-1">
            {{ error || 'No plans found for the current filters.' }}
          </p>
        </div>
      </template>
    </DataTable>

    <!-- View/Print Modal -->
    <RawMaterialPlanViewModal
      v-if="selectedPlanId"
      :plan-id="selectedPlanId"
      :open="isViewModalOpen"
      @update:open="handleModalClose"
      @edit="
        (plan) => {
          handleModalClose(false);
          emit('edit', plan);
        }
      "
      :auto-print="isAutoPrint"
    />
  </div>
</template>
