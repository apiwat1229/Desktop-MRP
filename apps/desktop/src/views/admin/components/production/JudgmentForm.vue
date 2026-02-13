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

      <div class="relative z-10">
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
            class="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border shadow-sm"
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
                <TableRow v-for="(row, index) in form.rows" :key="index">
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
                          :class="
                            row.weight1Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
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
                          :class="
                            row.weight2Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
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
                          :class="
                            row.weight3Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
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
                          :class="
                            row.weight4Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
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
                          :class="
                            row.weight5Status === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
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
                          :class="
                            row.sampleStatus === 'PASS'
                              ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
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

        <!-- Stats & Judgment Section -->
        <div class="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
              <div class="space-y-2">
                <Label>{{ t('production.footer.baleBagLotNo') }}</Label>
                <div
                  class="h-10 flex items-center px-3 border rounded-md bg-slate-50 font-bold text-slate-700 italic"
                >
                  {{ form.baleBagLotNo || '-' }}
                </div>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <div
                  class="flex flex-col items-center justify-center p-3 border rounded-xl bg-blue-50/50 border-blue-100"
                >
                  <span class="text-[10px] font-black text-blue-400 uppercase tracking-tighter mb-1"
                    >SAMPLES</span
                  >
                  <span class="text-xl font-black text-blue-600 tabular-nums">{{
                    totalSample
                  }}</span>
                </div>
                <div
                  class="flex flex-col items-center justify-center p-3 border rounded-xl bg-green-50/50 border-green-100"
                >
                  <span
                    class="text-[10px] font-black text-green-400 uppercase tracking-tighter mb-1"
                    >PALLETS</span
                  >
                  <span class="text-xl font-black text-green-600 tabular-nums">{{
                    totalPallets
                  }}</span>
                </div>
                <div
                  class="flex flex-col items-center justify-center p-3 border rounded-xl bg-orange-50/50 border-orange-100"
                >
                  <span
                    class="text-[10px] font-black text-orange-400 uppercase tracking-tighter mb-1"
                    >BALES</span
                  >
                  <span class="text-xl font-black text-orange-600 tabular-nums">{{
                    totalBales
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Editable Judgment Fields -->
            <div class="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-dashed">
              <div class="space-y-2 col-span-2">
                <Label class="text-primary font-black uppercase text-[10px] tracking-widest"
                  >Laboratory Judgment</Label
                >
                <Input
                  v-model="form.judgedBy"
                  class="bg-white border-primary/20 focus:border-primary h-12 text-lg font-black text-primary"
                  placeholder="Enter Name"
                />
              </div>
              <div class="space-y-2">
                <Label class="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{{
                  t('production.footer.checkedBy')
                }}</Label>
                <Input v-model="form.checkedBy" class="bg-white" />
              </div>
              <div class="space-y-2">
                <Label class="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{{
                  t('production.footer.issuedBy')
                }}</Label>
                <Input v-model="form.issuedBy" class="bg-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Spacer -->
        <div class="h-20"></div>
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
