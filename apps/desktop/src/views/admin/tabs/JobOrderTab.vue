<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { jobOrdersApi, type JobOrder } from '@/services/jobOrders';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { format } from 'date-fns';
import { CheckCircle2, Clock, Edit, FileText, Plus } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
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

const handleEdit = (jobOrder: JobOrder) => {
  emit('edit', jobOrder);
};

const handlePrint = (jobOrder: JobOrder) => {
  selectedJobOrder.value = jobOrder;
  isPrintDialogOpen.value = true;
};

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
      <div class="flex items-center justify-center lg:justify-start gap-12 relative z-10 flex-1">
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
        <Button
          @click="emit('create')"
          class="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-primary/20 shadow-lg px-6 h-10 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
        >
          <Plus class="w-4 h-4" />
          {{ t('qa.jobOrderMgmt.newOrder') }}
        </Button>
      </div>
    </div>

    <!-- Job Orders Table -->
    <div>
      <div class="overflow-x-auto">
        <Table>
          <TableHeader class="bg-slate-50/50">
            <TableRow class="hover:bg-transparent border-b-2">
              <TableHead class="font-black text-slate-700">Date</TableHead>
              <TableHead class="font-black text-slate-700">
                {{ t('qa.jobOrderMgmt.cols.no') }}
              </TableHead>
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.contract')
              }}</TableHead>
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.grade')
              }}</TableHead>
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.palletSpecs')
              }}</TableHead>
              <TableHead class="font-black text-slate-700 text-center">{{
                t('qa.jobOrderForm.palletMarking')
              }}</TableHead>
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.status')
              }}</TableHead>
              <TableHead class="w-[100px] text-center font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.action')
              }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading" v-for="i in 3" :key="i" class="animate-pulse">
              <TableCell v-for="j in 7" :key="j">
                <div class="h-4 bg-slate-100 rounded"></div>
              </TableCell>
            </TableRow>

            <TableRow v-else-if="filteredJobOrders.length === 0">
              <TableCell colspan="7" class="py-20 text-center">
                <div class="flex flex-col items-center justify-center">
                  <div class="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100/50">
                    <FileText class="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 class="text-lg font-bold text-slate-700 tracking-tight">
                    {{ t('qa.jobOrderMgmt.noOrders') }}
                  </h3>
                  <p class="text-slate-400 text-sm font-medium mt-1">
                    Try changing the date or search query.
                  </p>
                </div>
              </TableCell>
            </TableRow>

            <TableRow
              v-for="order in filteredJobOrders"
              :key="order.id"
              class="group hover:bg-slate-50/50 transition-all cursor-pointer border-b"
              @click="handleView(order)"
            >
              <TableCell class="font-bold text-slate-700">
                {{ format(new Date(order.qaDate), 'dd-MMM-yyyy') }}
              </TableCell>
              <TableCell class="font-black text-slate-900 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="
                      order.isClosed
                        ? 'bg-emerald-500 shadow-emerald-200 shadow-lg'
                        : 'bg-amber-500 shadow-amber-200 shadow-lg'
                    "
                  ></div>
                  {{ order.jobOrderNo }}
                </div>
              </TableCell>
              <TableCell class="font-bold text-slate-700">{{ order.contractNo }}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  class="font-bold bg-blue-100 text-blue-700 border-blue-200"
                >
                  {{ order.grade === 'Other' ? order.otherGrade : order.grade }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="text-xs flex flex-col gap-0.5">
                  <span class="font-bold text-slate-700">{{ order.palletType }}</span>
                  <span class="text-slate-600"
                    >{{ order.orderQuantity }} {{ t('qa.jobOrderMgmt.palletsCount') }} •
                    {{ order.quantityBale }} {{ t('qa.jobOrderMgmt.balesCount') }}</span
                  >
                </div>
              </TableCell>
              <TableCell class="text-center">
                <Badge
                  :class="
                    order.palletMarking
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  "
                  variant="outline"
                  class="font-bold"
                >
                  {{ order.palletMarking ? t('common.yes') : t('common.no') }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  v-if="order.isClosed"
                  class="bg-emerald-500 text-white border-0 shadow-sm font-bold"
                >
                  <CheckCircle2 class="w-3 h-3 mr-1" />
                  {{ t('qa.jobOrderMgmt.completed') }}
                </Badge>
                <Badge v-else class="bg-amber-500 text-white border-0 shadow-sm font-bold">
                  <Clock class="w-3 h-3 mr-1" />
                  {{ t('qa.jobOrderMgmt.inProgress') }}
                </Badge>
              </TableCell>
              <TableCell class="text-center">
                <div class="flex items-center justify-center gap-1">
                  <Button
                    v-if="!props.readonly"
                    variant="ghost"
                    size="icon"
                    class="h-9 w-9 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                    @click.stop="handleEdit(order)"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-9 w-9 text-primary hover:bg-primary/10 transition-colors"
                    @click.stop="handlePrint(order)"
                  >
                    <FileText class="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

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
