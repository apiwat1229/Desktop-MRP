<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePermissions } from '@/composables/usePermissions';
import { productionReportsApi, type ProductionReport } from '@/services/productionReports';
import { useAuthStore } from '@/stores/auth';
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date';
import { Check, FlaskConical, X } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const authStore = useAuthStore();
const props = defineProps<{
  initialData?: ProductionReport;
}>();

const emit = defineEmits(['saved', 'cancel']);
const { hasPermission, isAdmin } = usePermissions();

const canApprove = computed(
  () => isAdmin.value || hasPermission('production:approve') || hasPermission('production:update')
);

const form = reactive<ProductionReport>({
  id: undefined,
  dryerName: 'Dryer C',
  bookNo: '',
  pageNo: '',
  productionDate: new Date().toISOString().split('T')[0],
  shift: '1st',
  grade: '',
  ratioCL: 0,
  ratioUSS: 0,
  ratioCutting: 0,
  weightPalletRemained: 0,
  rows: [],
  baleBagLotNo: '',
  status: 'DRAFT',
  checkedBy: '',
  judgedBy: '',
  issuedBy: '',
});

// Date Picker State
const productionDateObject = ref<CalendarDate | undefined>(undefined);

const df = new DateFormatter('en-GB', {
  dateStyle: 'medium',
});

// Initialize date object from form data
watch(
  () => form.productionDate,
  (newDate) => {
    if (newDate) {
      try {
        const dateStr =
          typeof newDate === 'string'
            ? newDate
            : newDate instanceof Date
              ? newDate.toISOString()
              : String(newDate);
        const d = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        productionDateObject.value = parseDate(d);
      } catch (e) {
        console.error('Invalid date format', e);
      }
    }
  },
  { immediate: true }
);

const totalSample = computed(() => {
  return form.rows.reduce(
    (sum, row) => sum + (parseFloat(row.sampleCount?.toString() || '0') || 0),
    0
  );
});

const totalPallets = computed(() => {
  return form.rows.reduce((sum, row) => {
    let rowPallets = 0;
    if (parseFloat(row.weight1?.toString() || '0') > 0) rowPallets++;
    if (parseFloat(row.weight2?.toString() || '0') > 0) rowPallets++;
    if (parseFloat(row.weight3?.toString() || '0') > 0) rowPallets++;
    if (parseFloat(row.weight4?.toString() || '0') > 0) rowPallets++;
    if (parseFloat(row.weight5?.toString() || '0') > 0) rowPallets++;
    return sum + rowPallets;
  }, 0);
});

const totalBales = computed(() => {
  return form.rows.reduce((sum, row) => {
    const w1 = parseFloat(row.weight1?.toString() || '0') || 0;
    const w2 = parseFloat(row.weight2?.toString() || '0') || 0;
    const w3 = parseFloat(row.weight3?.toString() || '0') || 0;
    const w4 = parseFloat(row.weight4?.toString() || '0') || 0;
    const w5 = parseFloat(row.weight5?.toString() || '0') || 0;
    return sum + w1 + w2 + w3 + w4 + w5;
  }, 0);
});

const failedPallets = computed(() => {
  return form.rows.reduce((sum, row) => {
    let count = 0;
    if (row.weight1Status === 'FAIL') count++;
    if (row.weight2Status === 'FAIL') count++;
    if (row.weight3Status === 'FAIL') count++;
    if (row.weight4Status === 'FAIL') count++;
    if (row.weight5Status === 'FAIL') count++;
    return sum + count;
  }, 0);
});

const failedBales = computed(() => {
  return form.rows.reduce((sum, row) => {
    let count = 0;
    if (row.weight1Status === 'FAIL') count += parseFloat(row.weight1?.toString() || '0') || 0;
    if (row.weight2Status === 'FAIL') count += parseFloat(row.weight2?.toString() || '0') || 0;
    if (row.weight3Status === 'FAIL') count += parseFloat(row.weight3?.toString() || '0') || 0;
    if (row.weight4Status === 'FAIL') count += parseFloat(row.weight4?.toString() || '0') || 0;
    if (row.weight5Status === 'FAIL') count += parseFloat(row.weight5?.toString() || '0') || 0;
    return sum + count;
  }, 0);
});

const toggleJudgment = (row: any, field: string, status: 'PASS' | 'FAIL') => {
  const currentStatus = (row as any)[field];
  const newStatus = currentStatus === status ? undefined : status;

  if (field === 'sampleStatus' && newStatus) {
    // Bulk update for the whole row (Direct)
    row.sampleStatus = newStatus;
    row.weight1Status = newStatus;
    row.weight2Status = newStatus;
    row.weight3Status = newStatus;
    row.weight4Status = newStatus;
    row.weight5Status = newStatus;
  } else {
    (row as any)[field] = newStatus;
  }
};

const showConfirmSave = ref(false);

const handleSave = async () => {
  showConfirmSave.value = true;
};

const executeSave = async () => {
  showConfirmSave.value = false;
  try {
    const data = await productionReportsApi.update(
      props.initialData?.id || (form.id as string),
      form
    );
    Object.assign(form, data);
    toast.success(t('common.saveSuccess'));
    emit('saved');
  } catch (error: any) {
    console.error('Failed to save judgment:', error);
    toast.error(error.response?.data?.message || t('common.errorSave'));
  }
};

onMounted(() => {
  if (props.initialData) {
    Object.assign(form, props.initialData);
    if (typeof form.productionDate === 'string') {
      form.productionDate = form.productionDate.split('T')[0];
    }

    // Auto-fill Judged By with current user name if empty
    if (!form.judgedBy && authStore.user) {
      form.judgedBy = `${authStore.user.firstName} ${authStore.user.lastName || ''}`.trim();
    }
  }
});

const isRowPassed = (row: any) => {
  if (row.sampleStatus !== 'PASS') return false;
  if (parseFloat(row.weight1?.toString() || '0') > 0 && row.weight1Status !== 'PASS') return false;
  if (parseFloat(row.weight2?.toString() || '0') > 0 && row.weight2Status !== 'PASS') return false;
  if (parseFloat(row.weight3?.toString() || '0') > 0 && row.weight3Status !== 'PASS') return false;
  if (parseFloat(row.weight4?.toString() || '0') > 0 && row.weight4Status !== 'PASS') return false;
  if (parseFloat(row.weight5?.toString() || '0') > 0 && row.weight5Status !== 'PASS') return false;
  return true;
};

const showAllRows = ref(false);
const visibleRows = computed(() => {
  if (showAllRows.value) return form.rows;
  return form.rows.filter((row) => !isRowPassed(row));
});

const isFormValid = computed(() => {
  // Check if mandatory header is filled
  if (!form.judgedBy) return false;

  // Check rows
  for (const row of form.rows) {
    if (!row.sampleStatus) return false;

    if (parseFloat(row.weight1?.toString() || '0') > 0 && !row.weight1Status) return false;
    if (parseFloat(row.weight2?.toString() || '0') > 0 && !row.weight2Status) return false;
    if (parseFloat(row.weight3?.toString() || '0') > 0 && !row.weight3Status) return false;
    if (parseFloat(row.weight4?.toString() || '0') > 0 && !row.weight4Status) return false;
    if (parseFloat(row.weight5?.toString() || '0') > 0 && !row.weight5Status) return false;
  }

  return true;
});
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- Judgment Header -->
    <div
      class="rounded-xl border bg-white shadow-sm p-4 px-6 relative overflow-hidden flex items-center justify-between gap-6"
    >
      <FlaskConical
        class="absolute -right-8 -bottom-8 w-48 h-48 text-slate-100/50 -rotate-12 pointer-events-none"
      />

      <div class="relative z-10 min-w-[200px]">
        <h2 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div class="p-2 bg-primary/10 rounded-lg">
            <FlaskConical class="w-5 h-5 text-primary" />
          </div>
          {{ t('qa.tabs.judgment') }}
        </h2>
        <p class="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1 opacity-70">
          DAILY PRODUCTION & QUALITY REPORT
        </p>
      </div>

      <!-- Compact Stats in Header -->
      <div
        class="flex-1 hidden md:flex items-center justify-center gap-10 relative z-10 px-8 border-x border-slate-100"
      >
        <div class="flex flex-col items-center">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"
            >PALLETS</span
          >
          <div class="flex items-end gap-3">
            <template v-if="failedPallets > 0">
              <div class="flex flex-col items-center">
                <span class="text-[8px] font-bold text-red-500 uppercase leading-none mb-1"
                  >FAIL</span
                >
                <span class="text-xl font-black text-red-600 tabular-nums leading-none">{{
                  failedPallets
                }}</span>
              </div>
              <div class="w-px h-6 bg-slate-100 mt-1"></div>
            </template>

            <div class="flex flex-col items-center" :class="{ 'opacity-40': failedPallets > 0 }">
              <span class="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1"
                >TOTAL</span
              >
              <span
                class="tabular-nums leading-none"
                :class="
                  failedPallets > 0
                    ? 'text-lg font-bold text-slate-600'
                    : 'text-xl font-black text-slate-900'
                "
                >{{ totalPallets }}</span
              >
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"
            >BALES</span
          >
          <div class="flex items-end gap-3">
            <template v-if="failedBales > 0">
              <div class="flex flex-col items-center">
                <span class="text-[8px] font-bold text-red-500 uppercase leading-none mb-1"
                  >FAIL</span
                >
                <span class="text-xl font-black text-red-600 tabular-nums leading-none">{{
                  failedBales.toLocaleString()
                }}</span>
              </div>
              <div class="w-px h-6 bg-slate-100 mt-1"></div>
            </template>

            <div class="flex flex-col items-center" :class="{ 'opacity-40': failedBales > 0 }">
              <span class="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1"
                >TOTAL</span
              >
              <span
                class="tabular-nums leading-none"
                :class="
                  failedBales > 0
                    ? 'text-lg font-bold text-slate-600'
                    : 'text-xl font-black text-slate-900'
                "
                >{{ totalBales.toLocaleString() }}</span
              >
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center">
          <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1"
            >SAMPLES</span
          >
          <span class="text-2xl font-black text-blue-600 tabular-nums leading-none">{{
            totalSample
          }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3 relative z-10">
        <Button variant="ghost" @click="emit('cancel')" class="h-10 px-6 font-bold rounded-xl">
          {{ t('common.back') }}
        </Button>
        <Button
          @click="handleSave"
          :disabled="!canApprove || !isFormValid"
          class="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-primary/20 shadow-lg px-8 h-10 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
          <Check class="w-4 h-4" />
          {{ t('common.save') }}
        </Button>
      </div>
    </div>

    <Card class="flex-1 flex flex-col overflow-hidden border-none shadow-none bg-transparent">
      <CardContent class="flex-1 overflow-y-auto p-1 space-y-6 pr-2">
        <fieldset class="space-y-6 block">
          <!-- Header Info (Readonly) -->
          <div
            class="grid grid-cols-1 md:grid-cols-5 gap-6 bg-white p-6 rounded-xl border shadow-sm"
          >
            <div class="space-y-2">
              <Label>{{ t('production.productionDate') }}</Label>
              <div
                class="h-10 flex items-center px-3 border rounded-md bg-slate-50 font-bold text-slate-700"
              >
                {{
                  productionDateObject
                    ? df.format(productionDateObject.toDate(getLocalTimeZone()))
                    : '-'
                }}
              </div>
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.shift') }}</Label>
              <div
                class="h-10 flex items-center px-3 border rounded-md bg-slate-50 font-bold text-slate-700"
              >
                {{ form.shift }}
              </div>
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.grade') }}</Label>
              <div
                class="h-10 flex items-center px-3 border rounded-md bg-slate-50 font-bold text-slate-700"
              >
                {{ form.grade }}
              </div>
            </div>
            <div class="space-y-2">
              <Label class="text-xs">{{ t('production.ratio') }} (CL / USS / Cut)</Label>
              <div class="flex items-center gap-2 h-10">
                <div
                  class="flex-1 h-10 flex items-center justify-center border rounded-md bg-slate-50 font-bold text-slate-700 text-xs"
                >
                  {{ form.ratioCL }}%
                </div>
                <div
                  class="flex-1 h-10 flex items-center justify-center border rounded-md bg-slate-50 font-bold text-slate-700 text-xs"
                >
                  {{ form.ratioUSS }}%
                </div>
                <div
                  class="flex-1 h-10 flex items-center justify-center border rounded-md bg-slate-50 font-bold text-slate-700 text-xs"
                >
                  {{ form.ratioCutting }}%
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.footer.baleBagLotNo') }}</Label>
              <div
                class="h-10 flex items-center px-3 border rounded-md bg-slate-50 font-bold text-slate-700 italic"
              >
                {{ form.baleBagLotNo || '-' }}
              </div>
            </div>
          </div>

          <!-- Table Header Controls -->
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
            <div class="flex items-center gap-4">
              <h3
                class="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"
              >
                Production Details
                <span
                  v-if="!showAllRows && form.rows.length > visibleRows.length"
                  class="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black animate-pulse"
                >
                  Hiding {{ form.rows.length - visibleRows.length }} Passed Rows
                </span>
              </h3>
            </div>

            <div class="flex-1 flex flex-wrap items-center justify-center gap-4">
              <!-- Signature Fields -->
              <div
                class="flex flex-wrap items-center gap-3 bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-200"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold text-primary uppercase tracking-widest whitespace-nowrap"
                    >Lab Judgment:</span
                  >
                  <Input
                    v-model="form.judgedBy"
                    class="bg-white border-primary/20 h-8 w-40 text-sm font-bold text-primary py-0 px-2"
                    placeholder="Name"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap"
                    >Checked:</span
                  >
                  <Input
                    v-model="form.checkedBy"
                    class="bg-white border-slate-200 h-8 w-40 text-sm font-bold py-0 px-2"
                    placeholder="Name"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap"
                    >Issued:</span
                  >
                  <Input
                    v-model="form.issuedBy"
                    class="bg-white border-slate-200 h-8 w-40 text-sm font-bold py-0 px-2"
                    placeholder="Name"
                  />
                </div>
              </div>
            </div>

            <!-- Display Mode (Far Right) -->
            <div
              class="flex items-center gap-3 bg-white p-1 px-3 rounded-lg border border-slate-100 shadow-sm"
            >
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >Display Mode:</span
              >
              <button
                @click="showAllRows = false"
                class="text-[10px] px-3 py-1.5 rounded-md font-black transition-all"
                :class="
                  !showAllRows
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                "
              >
                EXCEPTIONS
              </button>
              <button
                @click="showAllRows = true"
                class="text-[10px] px-3 py-1.5 rounded-md font-black transition-all"
                :class="
                  showAllRows
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                "
              >
                SHOW ALL
              </button>
            </div>
          </div>

          <!-- Table (Readonly) -->
          <div class="rounded-xl border shadow-sm bg-white overflow-hidden">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead class="w-24 text-center">{{
                    t('production.table.startTime')
                  }}</TableHead>
                  <TableHead class="w-32 text-center">{{
                    t('production.table.palletType')
                  }}</TableHead>
                  <TableHead class="w-40 text-center">{{ t('production.table.lotNo') }}</TableHead>
                  <TableHead v-for="i in 5" :key="i" class="text-center w-24">{{
                    t('production.pallet', { n: i })
                  }}</TableHead>
                  <TableHead class="w-24 text-center">{{
                    t('production.table.sampleCount')
                  }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(row, index) in visibleRows" :key="index">
                  <TableCell class="text-center font-bold text-slate-700">{{
                    row.startTime
                  }}</TableCell>
                  <TableCell class="text-center font-bold text-slate-700">{{
                    row.palletType
                  }}</TableCell>
                  <TableCell class="text-center font-bold text-slate-700">{{
                    row.lotNo
                  }}</TableCell>
                  <TableCell class="text-center tabular-nums">
                    <div class="flex flex-col items-center gap-1">
                      <span class="font-medium">{{ row.weight1 }}</span>
                      <div class="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight1Status === 'PASS'"
                          :class="
                            row.weight1Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 disabled:opacity-100'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-green-600'
                          "
                          @click="toggleJudgment(row, 'weight1Status', 'PASS')"
                        >
                          <Check class="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight1Status === 'PASS'"
                          :class="
                            row.weight1Status === 'FAIL'
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-red-600'
                          "
                          @click="toggleJudgment(row, 'weight1Status', 'FAIL')"
                        >
                          <X class="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-center tabular-nums">
                    <div class="flex flex-col items-center gap-1">
                      <span class="font-medium">{{ row.weight2 }}</span>
                      <div class="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight2Status === 'PASS'"
                          :class="
                            row.weight2Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 disabled:opacity-100'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-green-600'
                          "
                          @click="toggleJudgment(row, 'weight2Status', 'PASS')"
                        >
                          <Check class="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight2Status === 'PASS'"
                          :class="
                            row.weight2Status === 'FAIL'
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-red-600'
                          "
                          @click="toggleJudgment(row, 'weight2Status', 'FAIL')"
                        >
                          <X class="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-center tabular-nums">
                    <div class="flex flex-col items-center gap-1">
                      <span class="font-medium">{{ row.weight3 }}</span>
                      <div class="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight3Status === 'PASS'"
                          :class="
                            row.weight3Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 disabled:opacity-100'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-green-600'
                          "
                          @click="toggleJudgment(row, 'weight3Status', 'PASS')"
                        >
                          <Check class="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight3Status === 'PASS'"
                          :class="
                            row.weight3Status === 'FAIL'
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-red-600'
                          "
                          @click="toggleJudgment(row, 'weight3Status', 'FAIL')"
                        >
                          <X class="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-center tabular-nums">
                    <div class="flex flex-col items-center gap-1">
                      <span class="font-medium">{{ row.weight4 }}</span>
                      <div class="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight4Status === 'PASS'"
                          :class="
                            row.weight4Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 disabled:opacity-100'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-green-600'
                          "
                          @click="toggleJudgment(row, 'weight4Status', 'PASS')"
                        >
                          <Check class="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight4Status === 'PASS'"
                          :class="
                            row.weight4Status === 'FAIL'
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-red-600'
                          "
                          @click="toggleJudgment(row, 'weight4Status', 'FAIL')"
                        >
                          <X class="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-center tabular-nums">
                    <div class="flex flex-col items-center gap-1">
                      <span class="font-medium">{{ row.weight5 }}</span>
                      <div class="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight5Status === 'PASS'"
                          :class="
                            row.weight5Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 disabled:opacity-100'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-green-600'
                          "
                          @click="toggleJudgment(row, 'weight5Status', 'PASS')"
                        >
                          <Check class="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.weight5Status === 'PASS'"
                          :class="
                            row.weight5Status === 'FAIL'
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-red-600'
                          "
                          @click="toggleJudgment(row, 'weight5Status', 'FAIL')"
                        >
                          <X class="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-center">
                    <div class="flex flex-col items-center gap-1">
                      <span class="font-black text-primary">{{ row.sampleCount }}</span>
                      <div class="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.sampleStatus === 'PASS'"
                          :class="
                            row.sampleStatus === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 disabled:opacity-100'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-green-600'
                          "
                          @click="toggleJudgment(row, 'sampleStatus', 'PASS')"
                        >
                          <Check class="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-6 w-6 rounded-md p-0"
                          :disabled="row.sampleStatus === 'PASS'"
                          :class="
                            row.sampleStatus === 'FAIL'
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-red-600'
                          "
                          @click="toggleJudgment(row, 'sampleStatus', 'FAIL')"
                        >
                          <X class="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </fieldset>
      </CardContent>
    </Card>

    <AlertDialog :open="showConfirmSave" @update:open="showConfirmSave = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Save Judgment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to save all laboratory judgments for this production report?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="executeSave"
            class="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Confirm Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
