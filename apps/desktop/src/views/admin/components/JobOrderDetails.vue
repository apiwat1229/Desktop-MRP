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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { jobOrdersApi, type JobOrder, type JobOrderLog } from '@/services/jobOrders';
import { productionReportsApi, type ProductionReport } from '@/services/productionReports';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Link as LinkIcon,
  Package,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-vue-next';
import { computed, h, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

const props = defineProps<{
  jobOrder: JobOrder;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'updated', jobOrder: JobOrder): void;
}>();

const localJobOrder = ref<JobOrder>({ ...props.jobOrder });
const allReports = ref<ProductionReport[]>([]);
const reportSearchQuery = ref('');
const isLoadingReports = ref(false);
const isAddDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const isFinishDialogOpen = ref(false);
const logToDeleteIndex = ref<number | null>(null);
const selectedPalletsMap = ref<Record<string, boolean[]>>({}); // Key: reportId-lotNo

const totalMappedPallets = computed(() => {
  return (localJobOrder.value.logs || []).reduce(
    (sum: number, log: any) => sum + (log.quantity || 0),
    0
  );
});

const isTargetReached = computed(() => {
  const target = localJobOrder.value.orderQuantity || 0;
  return totalMappedPallets.value >= target;
});

const availableReportItems = computed(() => {
  const search = reportSearchQuery.value.toLowerCase().trim();
  const jobGrade = (localJobOrder.value.grade || '').toLowerCase().trim();
  const jobOtherGrade = (localJobOrder.value.otherGrade || '').toLowerCase().trim();

  const filteredReports = allReports.value.filter((r) => {
    const isSubmitted = r.status === 'SUBMITTED';
    if (!isSubmitted) return false;

    // If there's a search query, prioritize it
    if (search) {
      return (
        r.grade.toLowerCase().includes(search) ||
        r.rows?.some((row) => (row.lotNo || '').toLowerCase().includes(search))
      );
    }

    // Default: Match by grade
    const reportGrade = (r.grade || '').toLowerCase().trim();
    return (
      reportGrade === jobGrade ||
      (jobGrade === 'other' && reportGrade === jobOtherGrade) ||
      reportGrade === jobOtherGrade
    );
  });

  // Flatten reports into row items
  const items: any[] = [];
  filteredReports.forEach((report) => {
    (report.rows || []).forEach((row) => {
      // Aggregate mapped indices for this lot from existing logs
      const relevantLogs = (localJobOrder.value.logs || []).filter(
        (log) => log.lotStart === row.lotNo
      );

      const mappedIndices = relevantLogs.flatMap((log) =>
        (log.sign || '')
          .split(',')
          .filter(Boolean)
          .map((n) => parseInt(n))
      );

      // Get all available pallet indices in this row (based on weight)
      const availableIndicesInRow: number[] = [];
      for (let i = 1; i <= 5; i++) {
        const weight = (row as any)[`weight${i}`];
        if (weight && Number(weight) > 0) {
          availableIndicesInRow.push(i);
        }
      }

      // Find which ones are NOT mapped yet
      const unmappedIndices = availableIndicesInRow.filter((idx) => !mappedIndices.includes(idx));

      // If all pallets in this row are already mapped, hide the row
      if (unmappedIndices.length === 0) return;

      items.push({
        reportId: report.id,
        productionDate: report.productionDate,
        shift: report.shift,
        issuedBy: report.issuedBy,
        ...row,
        palletsInRow: availableIndicesInRow.length,
        unmappedIndices,
        mappedIndices,
      });
    });
  });

  // If searching, filter the flattened items too (in case of lotNo search)
  if (search) {
    return items.filter(
      (item) =>
        item.lotNo.toLowerCase().includes(search) ||
        (item.palletType || '').toLowerCase().includes(search)
    );
  }

  return items;
});

const progressPercent = computed(() => {
  if (!localJobOrder.value.orderQuantity) return 0;
  return Math.min(
    Math.round((totalMappedPallets.value / localJobOrder.value.orderQuantity) * 100),
    100
  );
});

const fetchAvailableReports = async () => {
  isLoadingReports.value = true;
  try {
    const reports = await productionReportsApi.getAll();
    allReports.value = reports;

    // Initialize selectedPalletsMap for each item
    selectedPalletsMap.value = {};
    availableReportItems.value.forEach((item) => {
      const key = `${item.reportId}-${item.lotNo}`;
      if (!selectedPalletsMap.value[key]) {
        selectedPalletsMap.value[key] = Array(5).fill(false);
      }
    });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoadingReports.value = false;
  }
};

const handleMapReport = (item: any) => {
  const key = `${item.reportId}-${item.lotNo}`;
  let selectedIndices = (selectedPalletsMap.value[key] || [])
    .map((checked, idx) => (checked ? idx + 1 : null))
    .filter((idx) => idx !== null) as number[];

  // If none selected, "All Batch" behavior: select all AVAILABLE/UNMAPPED pallets in this row
  if (selectedIndices.length === 0) {
    const autoSelected: boolean[] = Array(5).fill(false);
    selectedIndices = [];
    (item.unmappedIndices || []).forEach((idx: number) => {
      autoSelected[idx - 1] = true;
      selectedIndices.push(idx);
    });
    selectedPalletsMap.value[key] = autoSelected;
  }

  // If still no pallets (shouldn't happen with valid reports but safe check)
  if (selectedIndices.length === 0) {
    toast.error('No pallets found in this lot to map');
    return;
  }

  // Target enforcement check
  const target = localJobOrder.value.orderQuantity || 0;
  const remainingRoom = target - totalMappedPallets.value;

  if (remainingRoom <= 0) {
    toast.error('Target already reached. Cannot map more pallets.');
    return;
  }

  if (selectedIndices.length > remainingRoom) {
    toast.error(
      `Cannot map ${selectedIndices.length} pallets. Only ${remainingRoom} left to reach target.`
    );
    return;
  }

  const lotNo = item.lotNo || 'N/A';

  const newLog: JobOrderLog = {
    date:
      typeof item.productionDate === 'string'
        ? item.productionDate
        : item.productionDate.toISOString(),
    shift: item.shift === '1st' || item.shift === '1' ? ('1st' as any) : ('2nd' as any),
    lotStart: lotNo,
    lotEnd: lotNo,
    quantity: selectedIndices.length,
    sign: selectedIndices.join(','),
  };

  if (!localJobOrder.value.logs) localJobOrder.value.logs = [];
  localJobOrder.value.logs.push(newLog);

  saveUpdate();
  // Clear selection for this item after mapping
  selectedPalletsMap.value[key] = Array(5).fill(false);
};

const batchColumns = computed(() => [
  {
    accessorKey: 'productionDate',
    header: () =>
      h(
        'div',
        { class: 'font-black text-[10px] uppercase' },
        t('qa.jobOrderDetails.recordData') + ' / Time'
      ),
    cell: ({ row }: any) => {
      const item = row.original;
      return h('div', {}, [
        h(
          'div',
          { class: 'font-black text-slate-900' },
          format(new Date(item.productionDate), 'dd-MMM-yyyy')
        ),
        h('div', { class: 'font-mono text-[9px] text-slate-400 flex items-center gap-1' }, [
          h(Clock, { class: 'w-2.5 h-2.5' }),
          item.startTime,
        ]),
      ]);
    },
  },
  {
    accessorKey: 'shift',
    header: () => h('div', { class: 'font-black text-[10px] uppercase' }, 'Shift'),
    cell: ({ row }: any) =>
      h(
        Badge,
        { variant: 'outline', class: 'font-bold border-slate-200' },
        () => row.original.shift
      ),
  },
  {
    id: 'lotInfo',
    header: () => h('div', { class: 'font-black text-[10px] uppercase' }, 'Lot Number / Type'),
    cell: ({ row }: any) => {
      const item = row.original;
      return h('div', {}, [
        h(
          'div',
          { class: 'font-mono text-base font-black text-primary leading-tight' },
          item.lotNo
        ),
        h('div', { class: 'text-[9px] text-slate-400 font-bold' }, `Type: ${item.palletType}`),
      ]);
    },
  },
  {
    id: 'pallets',
    header: () => h('div', { class: 'font-black text-[10px] uppercase text-center' }, 'Pallets'),
    cell: ({ row }: any) => {
      const item = row.original;
      const key = `${item.reportId}-${item.lotNo}`;
      if (!selectedPalletsMap.value[key]) {
        selectedPalletsMap.value[key] = Array(item.palletsInRow).fill(false);
      }

      const checkboxes: any[] = [];
      (item.unmappedIndices || []).forEach((i: number) => {
        checkboxes.push(
          h('div', { class: 'flex flex-col items-center gap-1' }, [
            h(Checkbox, {
              checked: selectedPalletsMap.value[key][i - 1],
              'onUpdate:checked': (val: boolean) => {
                selectedPalletsMap.value[key][i - 1] = val;
              },
            }),
            h('span', { class: 'text-[8px] font-bold text-slate-400' }, `#${i}`),
          ])
        );
      });

      return h('div', { class: 'flex items-center justify-center gap-3' }, checkboxes);
    },
  },
  {
    id: 'actions',
    header: () => h('div', {}, ''),
    cell: ({ row }: any) => {
      const item = row.original;
      const key = `${item.reportId}-${item.lotNo}`;
      const hasSelection = (selectedPalletsMap.value[key] || []).some(
        (checked: boolean) => checked
      );
      const selectedCount = (selectedPalletsMap.value[key] || []).filter(
        (checked: boolean) => checked
      ).length;

      return h(
        Button,
        {
          size: 'sm',
          class:
            'font-black w-full bg-primary text-white hover:bg-primary/90 border-none shadow-sm',
          variant: 'default',
          onClick: () => handleMapReport(row.original),
        },
        () =>
          hasSelection
            ? `Map Selected (${selectedCount})`
            : `Map All (${item.unmappedIndices.length})`
      );
    },
  },
]);

const allocationColumns = computed(() => [
  {
    accessorKey: 'date',
    header: () =>
      h('div', { class: 'font-black text-[10px] uppercase' }, t('qa.jobOrderDetails.mappedDate')),
    cell: ({ row }: any) =>
      h(
        'div',
        { class: 'font-bold text-slate-900' },
        format(new Date(row.original.date), 'dd-MMM-yyyy')
      ),
  },
  {
    accessorKey: 'shift',
    header: () =>
      h('div', { class: 'font-black text-[10px] uppercase text-center' }, t('production.shift')),
    cell: ({ row }: any) =>
      h('div', { class: 'flex justify-center' }, [
        h(
          Badge,
          { variant: 'outline', class: 'font-bold border-slate-200 uppercase' },
          () => row.original.shift
        ),
      ]),
  },
  {
    accessorKey: 'lotStart',
    header: () =>
      h(
        'div',
        { class: 'font-black text-[10px] uppercase text-center' },
        t('production.table.lotNo')
      ),
    cell: ({ row }: any) =>
      h(
        'div',
        { class: 'text-center font-mono text-base font-black text-slate-900 tracking-tight' },
        row.original.lotStart
      ),
  },
  {
    accessorKey: 'quantity',
    header: () =>
      h(
        'div',
        { class: 'font-black text-[10px] uppercase text-center' },
        t('production.stats.totalPallets')
      ),
    cell: ({ row }: any) =>
      h('div', { class: 'text-center font-black text-slate-900' }, row.original.quantity),
  },
  {
    id: 'actions',
    header: () => h('div', {}, ''),
    cell: ({ row }: any) => {
      if (props.readonly || localJobOrder.value.isClosed) return null;
      return h('div', { class: 'flex justify-end pr-2' }, [
        h(
          Button,
          {
            size: 'icon',
            variant: 'ghost',
            class: 'h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10',
            onClick: () => removeLog(row.original),
          },
          () => h(Trash2, { class: 'w-4 h-4' })
        ),
      ]);
    },
  },
]);

const removeLog = (logItem: any) => {
  const index = (localJobOrder.value.logs || []).findIndex((l) => l === logItem);
  if (index !== -1) {
    logToDeleteIndex.value = index;
    isDeleteDialogOpen.value = true;
  }
};

const confirmDelete = () => {
  if (logToDeleteIndex.value !== null) {
    localJobOrder.value.logs.splice(logToDeleteIndex.value, 1);
    saveUpdate();
    logToDeleteIndex.value = null;
    isDeleteDialogOpen.value = false;
  }
};

const handleFinishJob = async () => {
  try {
    if (localJobOrder.value.id) {
      const updated = await jobOrdersApi.update(localJobOrder.value.id, {
        isClosed: true,
      });
      localJobOrder.value = updated;
      emit('updated', updated);
      toast.success(t('common.updateSuccess'));
      isFinishDialogOpen.value = false;
    }
  } catch (error) {
    console.error('Failed to finish job:', error);
    toast.error(t('common.errorSave'));
  }
};

const saveUpdate = async () => {
  try {
    if (localJobOrder.value.id) {
      // Clean logs to send only necessary fields to avoid 500 error
      const cleanedLogs = (localJobOrder.value.logs || []).map((log) => ({
        date: log.date,
        shift: log.shift,
        lotStart: log.lotStart,
        lotEnd: log.lotEnd,
        quantity: typeof log.quantity === 'string' ? parseInt(log.quantity) : log.quantity,
        sign: log.sign || '',
      }));

      const updated = await jobOrdersApi.update(localJobOrder.value.id, {
        logs: cleanedLogs,
      });
      localJobOrder.value = updated;
      emit('updated', updated);
      toast.success(t('common.updateSuccess'));
    }
  } catch (error) {
    console.error('Failed to update mapping:', error);
    toast.error(t('common.errorSave'));
  }
};

watch(isAddDialogOpen, (val: boolean) => {
  if (val) {
    fetchAvailableReports();
    reportSearchQuery.value = '';
    selectedPalletsMap.value = {}; // Clear selections when dialog opens
  }
});

onMounted(() => {
  fetchAvailableReports();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Top Row: Full-width Job Order Info -->
    <Card class="border shadow-sm overflow-hidden">
      <CardHeader class="bg-slate-50 border-b py-3 px-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              @click="emit('back')"
              class="h-8 w-8 text-slate-400 hover:text-primary transition-colors"
            >
              <ArrowLeft class="w-4 h-4" />
            </Button>
            <CardTitle class="text-xs font-black flex items-center gap-2 text-slate-700">
              JOB ORDER INFO
            </CardTitle>
          </div>

          <!-- Middle: Production Status -->
          <div class="hidden md:flex flex-1 items-center justify-center gap-8 px-8">
            <div class="flex items-center gap-4">
              <div class="text-right">
                <div class="flex items-center gap-2 mb-0.5 justify-end">
                  <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span class="text-[9px] font-black text-primary uppercase tracking-wider"
                    >Live Tracking</span
                  >
                </div>
                <div class="text-xl font-black text-slate-900 leading-none">
                  {{ progressPercent }}%
                </div>
              </div>
              <div class="h-8 w-px bg-slate-200" />
              <div class="flex gap-4">
                <div>
                  <p
                    class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none"
                  >
                    Completed
                  </p>
                  <p class="text-sm font-black text-slate-900">
                    {{ totalMappedPallets }}
                    <span class="text-[8px] font-bold text-slate-500 uppercase">Pallets</span>
                  </p>
                </div>
                <div>
                  <p
                    class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none"
                  >
                    Target
                  </p>
                  <p class="text-sm font-black text-slate-900">
                    {{ localJobOrder.orderQuantity }}
                    <span class="text-[8px] font-bold text-slate-500 uppercase">Pallets</span>
                  </p>
                </div>
              </div>
            </div>
            <div class="w-32 lg:w-48">
              <Progress :model-value="progressPercent" class="h-2 bg-slate-200" />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Badge
              v-if="localJobOrder.isClosed"
              class="bg-emerald-500 text-white border-0 shadow-sm font-black px-3 py-1 text-[10px]"
            >
              <CheckCircle2 class="w-3 h-3 mr-1" />
              {{ t('qa.jobOrderMgmt.completed') }}
            </Badge>
            <Badge
              v-else
              class="bg-amber-500 text-white border-0 shadow-sm font-black px-3 py-1 text-[10px]"
            >
              <Clock class="w-3 h-3 mr-1" />
              {{ t('qa.jobOrderMgmt.inProgress') }}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent class="p-4">
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          <div>
            <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
              >Job Order No.</Label
            >
            <p class="font-black text-slate-900 leading-tight">{{ localJobOrder.jobOrderNo }}</p>
          </div>
          <div>
            <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
              >Contract No.</Label
            >
            <p class="font-bold text-slate-700 leading-tight">{{ localJobOrder.contractNo }}</p>
          </div>
          <div>
            <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
              >Grade</Label
            >
            <Badge variant="secondary" class="font-black bg-blue-100 text-blue-700 border-blue-200">
              {{ localJobOrder.grade === 'Other' ? localJobOrder.otherGrade : localJobOrder.grade }}
            </Badge>
          </div>
          <div>
            <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
              >Pallet Type</Label
            >
            <p class="font-bold text-slate-700 leading-tight">{{ localJobOrder.palletType }}</p>
          </div>
          <div>
            <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
              >Qty/Pallet</Label
            >
            <p class="font-bold text-slate-700 leading-tight">
              {{ localJobOrder.quantityBale || 35 }} Bales
            </p>
          </div>
          <div>
            <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
              >Pallet Marking</Label
            >
            <Badge
              :class="
                localJobOrder.palletMarking
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              "
              variant="outline"
              class="font-bold"
            >
              {{ localJobOrder.palletMarking ? t('common.yes') : t('common.no') }}
            </Badge>
          </div>
          <div>
            <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
              >Target Quantity</Label
            >
            <p class="font-black text-primary leading-tight">
              {{ localJobOrder.orderQuantity }} Pallets
            </p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-y-2">
          <div class="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div class="flex items-center gap-2">
              <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block"
                >Date:</Label
              >
              <span class="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                <CalendarDays class="w-3.5 h-3.5 text-slate-400" />
                {{ format(new Date(localJobOrder.qaDate), 'dd-MMM-yyyy') }}
              </span>
            </div>
            <div v-if="localJobOrder.note" class="flex items-center gap-2">
              <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block"
                >Note:</Label
              >
              <span class="text-xs italic text-slate-500">"{{ localJobOrder.note }}"</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block"
              >Creator:</Label
            >
            <span class="text-sm font-bold text-slate-600 flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 text-slate-400" />
              {{ localJobOrder.qaName }}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 gap-6">
      <!-- Mapping Table -->
      <div class="space-y-6">
        <!-- Mapping Table -->
        <Card class="border-slate-200/60 shadow-none overflow-hidden h-full flex flex-col">
          <CardHeader
            class="flex flex-row items-center justify-between px-6 py-4 bg-slate-50/50 border-b border-slate-100"
          >
            <div class="flex items-center gap-2">
              <LinkIcon class="w-4 h-4 text-primary" />
              <CardTitle class="text-[13px] font-black uppercase tracking-wider text-slate-700">
                {{ t('qa.jobOrderDetails.productionAllocation') }}
              </CardTitle>
            </div>

            <div v-if="!readonly" class="flex items-center gap-2">
              <AlertDialog v-model:open="isFinishDialogOpen">
                <AlertDialogTrigger as-child>
                  <Button
                    v-if="!localJobOrder.isClosed"
                    size="sm"
                    variant="outline"
                    :class="[
                      'h-8 font-black rounded-lg shadow-sm transition-all duration-300',
                      isTargetReached
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700'
                        : 'text-slate-400 border-slate-200',
                    ]"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5 mr-1.5" />
                    {{ t('qa.jobOrderDetails.finishJob') || 'Finish Job' }}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{{ t('common.finishJobConfirm') }}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {{ t('common.finishJobDescription') }}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                    <AlertDialogAction
                      @click="handleFinishJob"
                      class="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {{ t('common.confirm') }}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Dialog v-model:open="isAddDialogOpen">
                <DialogTrigger as-child>
                  <Button
                    size="sm"
                    class="gap-1.5 h-8 font-black rounded-lg shadow-sm"
                    :disabled="isTargetReached || localJobOrder.isClosed"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    {{ t('qa.jobOrderDetails.mapBatch') }}
                  </Button>
                </DialogTrigger>
                <DialogContent class="max-w-5xl p-0 overflow-hidden border-none shadow-2xl">
                  <!-- Content same as before -->
                  <div class="bg-white">
                    <DialogHeader class="px-6 pt-6 pb-4">
                      <div class="flex items-center gap-3">
                        <div class="bg-primary/10 p-2.5 rounded-xl">
                          <FileText class="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <DialogTitle class="text-xl font-black text-slate-900 tracking-tight">
                            {{ t('qa.jobOrderDetails.selectBatch') }}
                          </DialogTitle>
                          <DialogDescription
                            class="text-xs font-bold text-slate-400 mt-0.5 flex items-center gap-1"
                          >
                            Listing completed (Submitted) reports for
                            <span class="text-primary font-black">{{ localJobOrder.grade }}</span>
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <div class="px-6 pb-4">
                      <div class="relative group">
                        <Search
                          class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors"
                        />
                        <Input
                          v-model="reportSearchQuery"
                          placeholder="Search by Grade or Lot Number..."
                          class="pl-10 h-11 bg-slate-50 border-slate-200/60 focus:bg-white focus:ring-primary focus:border-primary rounded-xl transition-all"
                        />
                      </div>
                    </div>

                    <div class="overflow-hidden flex flex-col max-h-[60vh] h-auto">
                      <DataTable
                        :columns="batchColumns"
                        :data="availableReportItems"
                        :loading="isLoadingReports"
                        class="outline-none"
                      >
                        <template #empty>
                          <div class="flex flex-col items-center justify-center py-12">
                            <div
                              class="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100/50"
                            >
                              <Package class="h-10 w-10 text-slate-200" />
                            </div>
                            <h3 class="text-lg font-bold text-slate-700 tracking-tight">
                              <div v-if="reportSearchQuery">
                                No items found matching "{{ reportSearchQuery }}"
                              </div>
                              <div v-else>
                                No items found for grade "{{ localJobOrder.grade }}".
                              </div>
                            </h3>
                            <p class="text-slate-400 text-sm font-medium mt-1">
                              Ensure reports are submitted and match the job order grade.
                            </p>
                          </div>
                        </template>
                      </DataTable>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent class="p-0 flex-1 flex flex-col min-h-0">
            <DataTable
              :columns="allocationColumns"
              :data="localJobOrder.logs || []"
              class="border-none"
            >
              <template #empty>
                <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div
                    class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"
                  >
                    <Package class="w-8 h-8 text-slate-200" />
                  </div>
                  <h3 class="text-sm font-black text-slate-900 uppercase tracking-wide">
                    {{ t('qa.jobOrderDetails.noAllocation') }}
                  </h3>
                  <p class="text-xs font-bold text-slate-400 mt-1 max-w-[200px]">
                    Start by adding production batches using the button above.
                  </p>
                </div>
              </template>
            </DataTable>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent
        class="max-w-[400px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden"
      >
        <div class="bg-white">
          <AlertDialogHeader class="px-6 pt-6 pb-4">
            <div class="flex items-center gap-3">
              <div class="bg-rose-50 p-2.5 rounded-xl">
                <Trash2 class="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <AlertDialogTitle class="text-xl font-black text-slate-900 tracking-tight">
                  {{ t('common.confirmDelete') }}
                </AlertDialogTitle>
                <AlertDialogDescription class="text-sm font-bold text-slate-400 mt-0.5">
                  {{ t('common.confirmDeleteDescription') }}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter class="px-6 pb-6 pt-2 flex flex-row gap-3">
            <AlertDialogCancel
              class="flex-1 h-11 rounded-xl border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition-all m-0"
              @click="isDeleteDialogOpen = false"
            >
              {{ t('common.cancel') }}
            </AlertDialogCancel>
            <AlertDialogAction
              class="flex-1 h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-200 transition-all m-0 border-none"
              @click="confirmDelete"
            >
              {{ t('common.delete') }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
