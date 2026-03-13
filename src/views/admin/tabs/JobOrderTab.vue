<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { jobOrdersApi, type JobOrder } from '@/services/jobOrders';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import type { ColumnDef } from '@tanstack/vue-table';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  Eye,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
} from 'lucide-vue-next';
import { computed, h, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import JobOrderPrint from '../components/JobOrderPrint.vue';

const { t } = useI18n();

const props = defineProps<{
  searchQuery: string;
  date?: string; // For backward compatibility with Production view
  startDate?: string; // For date range in QA view
  endDate?: string; // For date range in QA view
  readonly?: boolean;
  hideStats?: boolean;
}>();

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'edit', jobOrder: JobOrder): void;
  (e: 'view', jobOrder: JobOrder): void;
  (e: 'delete', id: string): void;
}>();

// Helper to parse string date back to CalendarDate-like object
const parseDateString = (dateStr: string) => {
  if (!dateStr) return null;
  try {
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = cleanDate.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new CalendarDate(year, month, day);
  } catch (e) {
    return null;
  }
};

const jobOrders = ref<JobOrder[]>([]);
const isLoading = ref(false);
const selectedJobOrder = ref<JobOrder | null>(null);

// Initialize from props
const searchQuery = ref(props.searchQuery || '');

// Check if we're in date range mode or single date mode
const isDateRangeMode = computed(() => !!props.startDate || !!props.endDate);

const startDate = ref<any>(
  props.startDate
    ? parseDateString(props.startDate)
    : today(getLocalTimeZone()).subtract({ days: 30 })
);
const endDate = ref<any>(
  props.endDate ? parseDateString(props.endDate) : today(getLocalTimeZone())
);
const singleDate = ref<any>(props.date ? parseDateString(props.date) : today(getLocalTimeZone()));

const isPrintDialogOpen = ref(false);

// Watch props
watch(
  () => props.searchQuery,
  (newVal) => {
    searchQuery.value = newVal;
  }
);

watch(
  () => props.date,
  (newVal) => {
    if (newVal && !isDateRangeMode.value) {
      singleDate.value = parseDateString(newVal);
    }
  }
);

watch(
  () => props.startDate,
  (newVal) => {
    if (newVal) {
      startDate.value = parseDateString(newVal);
    }
  }
);

watch(
  () => props.endDate,
  (newVal) => {
    if (newVal) {
      endDate.value = parseDateString(newVal);
    }
  }
);

const filteredJobOrders = computed(() => {
  let filtered = jobOrders.value;

  // Filter by date - use range mode or single date mode
  if (isDateRangeMode.value) {
    // Date range mode (for QA view)
    if (startDate.value) {
      const startDateStr = `${startDate.value.year}-${String(startDate.value.month).padStart(2, '0')}-${String(startDate.value.day).padStart(2, '0')}`;
      const endDateStr = endDate.value
        ? `${endDate.value.year}-${String(endDate.value.month).padStart(2, '0')}-${String(endDate.value.day).padStart(2, '0')}`
        : startDateStr;

      filtered = filtered.filter((order) => {
        const orderDate = order.qaDate ? order.qaDate.split('T')[0] : '';
        return orderDate >= startDateStr && orderDate <= endDateStr;
      });
    }
  } else {
    // Single date mode (for Production view)
    if (singleDate.value) {
      const targetDate = `${singleDate.value.year}-${String(singleDate.value.month).padStart(2, '0')}-${String(singleDate.value.day).padStart(2, '0')}`;
      filtered = filtered.filter((order) => {
        const orderDate = order.qaDate ? order.qaDate.split('T')[0] : '';
        return orderDate === targetDate;
      });
    }
  }

  // Filter by search query
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (order) =>
        order.jobOrderNo.toLowerCase().includes(q) ||
        order.contractNo.toLowerCase().includes(q) ||
        order.grade.toLowerCase().includes(q)
    );
  }

  return filtered;
});

const stats = computed(() => ({
  total: filteredJobOrders.value.length,
  active: filteredJobOrders.value.filter((j) => !j.isClosed).length,
  completed: filteredJobOrders.value.filter((j) => j.isClosed).length,
}));

const fetchJobOrders = async () => {
  isLoading.value = true;
  try {
    const data = await jobOrdersApi.getAll();
    jobOrders.value = data;
  } catch (error) {
    console.error('Failed to fetch job orders:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

const handleView = (jobOrder: JobOrder) => {
  emit('view', jobOrder);
};

const handlePrint = (order: JobOrder) => {
  selectedJobOrder.value = order;
  isPrintDialogOpen.value = true;
};

const handleEdit = (order: JobOrder) => {
  emit('edit', order);
};

const handleDelete = async (order: JobOrder) => {
  if (order.id) {
    emit('delete', order.id);
  }
};

// DataTable Columns
const columns = computed<ColumnDef<JobOrder>[]>(() => [
  {
    accessorKey: 'qaDate',
    header: () => h('div', { class: 'font-black text-slate-700' }, 'Date'),
    cell: ({ row }) => {
      const date = row.original.qaDate;
      return h('div', { class: 'font-bold text-slate-700' }, format(new Date(date), 'dd-MMM-yyyy'));
    },
  },
  {
    accessorKey: 'jobOrderNo',
    header: () => h('div', { class: 'font-black text-slate-700' }, t('qa.jobOrderMgmt.cols.no')),
    cell: ({ row }) => {
      const order = row.original;
      return h('div', { class: 'font-black text-slate-900 flex items-center gap-2' }, [
        h('div', {
          class: [
            'w-2 h-2 rounded-full',
            order.isClosed
              ? 'bg-emerald-500 shadow-emerald-200 shadow-lg'
              : 'bg-amber-500 shadow-amber-200 shadow-lg',
          ],
        }),
        order.jobOrderNo,
      ]);
    },
  },
  {
    accessorKey: 'contractNo',
    header: () =>
      h('div', { class: 'font-black text-slate-700' }, t('qa.jobOrderMgmt.cols.contract')),
    cell: ({ row }) => h('div', { class: 'font-bold text-slate-700' }, row.original.contractNo),
  },
  {
    accessorKey: 'grade',
    header: () => h('div', { class: 'font-black text-slate-700' }, t('qa.jobOrderMgmt.cols.grade')),
    cell: ({ row }) => {
      const order = row.original;
      return h(
        Badge,
        {
          variant: 'secondary',
          class: 'font-bold bg-blue-100 text-blue-700 border-blue-200',
        },
        () => (order.grade === 'Other' ? order.otherGrade : order.grade)
      );
    },
  },
  {
    accessorKey: 'palletSpecs',
    header: () =>
      h('div', { class: 'font-black text-slate-700' }, t('qa.jobOrderMgmt.cols.palletSpecs')),
    cell: ({ row }) => {
      const order = row.original;
      return h('div', { class: 'text-xs flex flex-col gap-0.5' }, [
        h('span', { class: 'font-bold text-slate-700' }, order.palletType),
        h(
          'span',
          { class: 'text-slate-600' },
          `${order.orderQuantity} ${t('qa.jobOrderMgmt.palletsCount')} • ${order.quantityBale} ${t('qa.jobOrderMgmt.balesCount')}`
        ),
      ]);
    },
  },
  {
    accessorKey: 'palletMarking',
    header: () =>
      h(
        'div',
        { class: 'font-black text-slate-700 w-full text-center' },
        t('qa.jobOrderForm.palletMarking')
      ),
    cell: ({ row }) => {
      const order = row.original;
      return h('div', { class: 'w-full flex justify-center' }, [
        h(
          Badge,
          {
            variant: 'outline',
            class: [
              'font-bold',
              order.palletMarking
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200',
            ],
          },
          () => (order.palletMarking ? t('common.yes') : t('common.no'))
        ),
      ]);
    },
  },
  {
    accessorKey: 'status',
    header: () =>
      h(
        'div',
        { class: 'font-black text-slate-700 w-full text-center' },
        t('qa.jobOrderMgmt.cols.status')
      ),
    cell: ({ row }) => {
      const order = row.original;
      const content = order.isClosed
        ? h(Badge, { class: 'bg-emerald-500 text-white border-0 shadow-sm font-bold' }, () => [
            h(CheckCircle2, { class: 'w-3 h-3 mr-1' }),
            t('qa.jobOrderMgmt.completed'),
          ])
        : h(Badge, { class: 'bg-amber-500 text-white border-0 shadow-sm font-bold' }, () => [
            h(Clock, { class: 'w-3 h-3 mr-1' }),
            t('qa.jobOrderMgmt.inProgress'),
          ]);

      return h('div', { class: 'w-full flex justify-center' }, [content]);
    },
  },
  {
    id: 'actions',
    header: () =>
      h(
        'div',
        { class: 'w-full text-center font-black text-slate-700' },
        t('qa.jobOrderMgmt.cols.action')
      ),
    cell: ({ row }) => {
      const order = row.original;
      const actions = [];

      // View Button
      actions.push(
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-primary hover:bg-primary/10 transition-colors',
            title: 'View Details',
            onClick: (e: Event) => {
              e.stopPropagation();
              handleView(order);
            },
          },
          () => h(Eye, { class: 'w-4 h-4' })
        )
      );

      // Edit Button (Conditionally Shown)
      if (!props.readonly && !order.isClosed) {
        actions.push(
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon',
              class: 'h-8 w-8 text-blue-600 hover:bg-blue-50 transition-colors',
              title: 'Edit',
              onClick: (e: Event) => {
                e.stopPropagation();
                handleEdit(order);
              },
            },
            () => h(Pencil, { class: 'w-4 h-4' })
          )
        );
      }

      // Print Button
      actions.push(
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-amber-600 hover:bg-amber-50 transition-colors',
            title: 'Print',
            onClick: (e: Event) => {
              e.stopPropagation();
              handlePrint(order);
            },
          },
          () => h(Printer, { class: 'w-4 h-4' })
        )
      );

      // Delete Button (Conditionally Shown)
      if (!props.readonly && !order.isClosed) {
        actions.push(
          h(
            AlertDialog,
            {},
            {
              trigger: () =>
                h(
                  Button,
                  {
                    variant: 'ghost',
                    size: 'icon',
                    class: 'h-8 w-8 text-rose-600 hover:bg-rose-50 transition-colors',
                    title: 'Delete',
                    onClick: (e: Event) => e.stopPropagation(),
                  },
                  () => h(Trash2, { class: 'w-4 h-4' })
                ),
              content: () =>
                h(AlertDialogContent, { onClick: (e: Event) => e.stopPropagation() }, [
                  h(AlertDialogHeader, [
                    h(AlertDialogTitle, t('common.confirmDelete')),
                    h(AlertDialogDescription, t('common.deleteWarning')),
                  ]),
                  h(AlertDialogFooter, [
                    h(AlertDialogCancel, t('common.cancel')),
                    h(
                      AlertDialogAction,
                      {
                        class: 'bg-rose-600 hover:bg-rose-700 text-white',
                        onClick: () => handleDelete(order),
                      },
                      t('common.confirm')
                    ),
                  ]),
                ]),
            }
          )
        );
      }

      return h('div', { class: 'w-full flex items-center justify-center gap-1' }, actions);
    },
  },
]);

const triggerPrint = () => {
  window.print();
};

// Save and Delete logic moved to parent (QualityAssurance)

onMounted(() => {
  fetchJobOrders();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Premium Stats Card with NEW ORDER button -->
    <div
      v-if="!hideStats"
      class="rounded-xl border bg-white shadow-sm p-4 px-6 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6"
    >
      <!-- Stats Section -->
      <div class="flex items-center justify-start gap-12 relative z-10 flex-1">
        <div class="text-center group/stat">
          <span
            class="block text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/stat:text-primary transition-colors"
            >TOTAL ORDERS</span
          >
          <span class="text-xl font-black text-slate-900 tabular-nums">{{ stats.total }}</span>
        </div>
        <div class="text-center group/stat">
          <span
            class="block text-[0.6rem] font-black text-blue-500 uppercase tracking-widest mb-1 group-hover/stat:text-blue-600 transition-colors"
            >ACTIVE JOBS</span
          >
          <span class="text-xl font-black text-blue-600 tabular-nums">{{ stats.active }}</span>
        </div>
        <div class="text-center group/stat">
          <span
            class="block text-[0.6rem] font-black text-emerald-500 uppercase tracking-widest mb-1 group-hover/stat:text-emerald-600 transition-colors"
            >COMPLETED</span
          >
          <span class="text-xl font-black text-emerald-600 tabular-nums">{{
            stats.completed
          }}</span>
        </div>
      </div>

      <!-- Action Button -->
      <div class="relative z-10" v-if="!readonly">
        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            @click="fetchJobOrders"
            :disabled="isLoading"
            class="h-10 gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-all rounded-xl"
          >
            <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-4 h-4" />
            Refresh
          </Button>
          <Button
            @click="emit('create')"
            class="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-primary/20 shadow-lg px-6 h-10 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
          >
            <Plus class="w-4 h-4" />
            {{ t('qa.jobOrderMgmt.newOrder') }}
          </Button>
        </div>
      </div>

      <!-- Decorative Background Icon -->
      <Printer
        class="absolute -right-8 -bottom-8 w-48 h-48 text-slate-100/50 -rotate-12 pointer-events-none"
      />
    </div>

    <!-- Job Orders DataTable -->
    <DataTable
      :columns="columns"
      :data="filteredJobOrders"
      :loading="isLoading"
      @row-click="handleView"
    >
      <template #empty>
        <div class="flex flex-col items-center justify-center py-20">
          <div class="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100/50">
            <Eye class="h-10 w-10 text-slate-200" />
          </div>
          <h3 class="text-lg font-bold text-slate-700 tracking-tight">
            {{ t('qa.jobOrderMgmt.noOrders') }}
          </h3>
          <p class="text-slate-400 text-sm font-medium mt-1">
            Try changing the date or search query.
          </p>
        </div>
      </template>
    </DataTable>

    <!-- Form Dialog Removed -->

    <!-- Print Preview Dialog -->
    <Dialog v-model:open="isPrintDialogOpen">
      <DialogContent class="max-w-[1000px] p-0 bg-slate-900/10 border-none shadow-none">
        <DialogHeader
          class="absolute -top-12 left-0 right-0 flex-row justify-between items-center text-white px-4"
        >
          <DialogTitle class="text-lg font-bold">Print Preview</DialogTitle>
          <DialogDescription class="sr-only"
            >Preview of the job order for printing</DialogDescription
          >
          <Button @click="triggerPrint" class="bg-emerald-500 hover:bg-emerald-600 font-bold px-6">
            Print Job Order
          </Button>
        </DialogHeader>
        <div class="flex justify-center p-8 bg-slate-100/50 rounded-xl">
          <JobOrderPrint v-if="selectedJobOrder" :data="selectedJobOrder" />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
