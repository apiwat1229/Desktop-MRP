<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { shippingPlansApi, type ShippingPlan } from '@/services/shippingPlans';
import type { ColumnDef } from '@tanstack/vue-table';
import { format } from 'date-fns';
import { FileText, Plus, Printer, RefreshCw } from 'lucide-vue-next';
import { computed, h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import LoadingPlanModal from '../components/shipping/LoadingPlanModal.vue';

const { t } = useI18n();
const props = defineProps<{
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}>();

const emit = defineEmits<{
  (e: 'create'): void;
}>();

const plans = ref<ShippingPlan[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Modal state
const isViewModalOpen = ref(false);
const selectedPlan = ref<ShippingPlan | null>(null);

const openPreview = (plan: ShippingPlan) => {
  selectedPlan.value = plan;
  isViewModalOpen.value = true;
};

const fetchPlans = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    plans.value = await shippingPlansApi.getAll();
  } catch (err: any) {
    console.error('Failed to fetch shipping plans:', err);
    error.value = 'Failed to load shipping plans.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchPlans);

const formatDate = (date: string | Date): string => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd-MMM-yy');
  } catch (e) {
    return String(date);
  }
};

const filteredPlans = computed(() => {
  let filtered = plans.value;

  if (props.startDate) {
    const start = props.startDate.split('T')[0];
    const end = props.endDate ? props.endDate.split('T')[0] : start;
    filtered = filtered.filter((p) => {
      const d = String(p.planDate).split('T')[0];
      return d >= start && d <= end;
    });
  }

  if (props.searchQuery) {
    const q = props.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.planNo.toLowerCase().includes(q) ||
        p.customer?.toLowerCase().includes(q) ||
        p.remark?.toLowerCase().includes(q)
    );
  }

  return filtered;
});

const columns: ColumnDef<ShippingPlan>[] = [
  {
    accessorKey: 'planDate',
    header: () => h('div', { class: 'font-black text-slate-700 uppercase text-[10px]' }, 'Date'),
    cell: ({ row }) => h('div', { class: 'font-bold' }, formatDate(row.original.planDate)),
  },
  {
    accessorKey: 'planNo',
    header: () =>
      h('div', { class: 'font-black text-slate-700 uppercase text-[10px]' }, 'Plan No.'),
    cell: ({ row }) => h('div', { class: 'font-black text-primary' }, row.original.planNo),
  },
  {
    accessorKey: 'customer',
    header: () =>
      h('div', { class: 'font-black text-slate-700 uppercase text-[10px]' }, 'Customer'),
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.customer || '-'),
  },
  {
    accessorKey: 'items',
    header: () =>
      h('div', { class: 'font-black text-slate-700 uppercase text-[10px] text-center' }, 'Pallets'),
    cell: ({ row }) =>
      h('div', { class: 'text-center font-bold' }, row.original.items?.length || 0),
  },
  {
    accessorKey: 'status',
    header: () =>
      h('div', { class: 'font-black text-slate-700 uppercase text-[10px] text-center' }, 'Status'),
    cell: ({ row }) =>
      h('div', { class: 'flex justify-center' }, [
        h(
          Badge,
          { variant: 'outline', class: 'uppercase font-black text-[9px]' },
          () => row.original.status || 'CREATED'
        ),
      ]),
  },
  {
    id: 'actions',
    header: () =>
      h('div', { class: 'font-black text-slate-700 uppercase text-[10px] text-center' }, 'Actions'),
    cell: ({ row }) =>
      h('div', { class: 'flex justify-center gap-2' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-primary hover:bg-primary/10',
            onClick: () => openPreview(row.original),
          },
          () => h(Printer, { class: 'w-4 h-4' })
        ),
      ]),
  },
];
</script>

<template>
  <div class="space-y-6">
    <div
      class="rounded-xl border bg-white shadow-sm p-4 px-6 flex items-center justify-between gap-6 relative overflow-hidden"
    >
      <div class="flex items-center gap-12 z-10 flex-1">
        <div>
          <span class="block text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1"
            >TOTAL PLANS</span
          >
          <span class="text-xl font-black text-slate-900 tabular-nums">{{
            filteredPlans.length
          }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          @click="fetchPlans"
          :disabled="isLoading"
          class="h-10 gap-2 font-bold text-slate-500 rounded-xl"
        >
          <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-4 h-4" />
          {{ t('common.refresh') }}
        </Button>
        <Button
          @click="emit('create')"
          class="bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg px-6 h-10 rounded-xl font-bold"
        >
          <Plus class="w-4 h-4" />
          New Loading Plan
        </Button>
      </div>

      <FileText
        class="absolute -right-8 -bottom-8 w-48 h-48 text-slate-100/50 -rotate-12 pointer-events-none"
      />
    </div>

    <DataTable
      :columns="columns"
      :data="filteredPlans"
      :loading="isLoading"
      @row-click="openPreview"
    >
      <template #empty>
        <div class="flex flex-col items-center justify-center py-20 text-slate-400">
          <FileText class="h-12 w-12 mb-4 opacity-20" />
          <h3 class="font-bold text-slate-700">No Loading Plans Found</h3>
          <p class="text-sm">Try adjusting your filters or create a new plan.</p>
        </div>
      </template>
    </DataTable>

    <LoadingPlanModal
      v-if="selectedPlan"
      v-model:open="isViewModalOpen"
      :plan-date="String(selectedPlan.planDate)"
      :plan-no="selectedPlan.planNo"
      :customer="selectedPlan.customer || ''"
      contract-no="-"
      :total-weight="0"
      :items="selectedPlan.items.map((i) => ({ lotNo: i.row?.lotNo || '-', palletNo: i.palletNo }))"
    />
  </div>
</template>
