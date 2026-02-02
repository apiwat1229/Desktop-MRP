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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Time24hPicker from '@/components/ui/time-picker/Time24hPicker.vue';
import { usePermissions } from '@/composables/usePermissions';
import { productionReportsApi, type ProductionReport } from '@/services/productionReports';
import { useAuthStore } from '@/stores/auth';
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date';
import { CalendarIcon, Check, Plus, Trash2 } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
const t = useI18n().t;
const authStore = useAuthStore();
const props = defineProps<{
  initialData?: ProductionReport;
}>();

const emit = defineEmits(['saved', 'cancel']);
const { hasPermission, isAdmin } = usePermissions();

const canUpdate = computed(() => isAdmin.value || hasPermission('production:update'));
const canDelete = computed(() => isAdmin.value || hasPermission('production:delete'));
const canApprove = computed(() => isAdmin.value || hasPermission('production:approve'));
const canCreate = computed(() => isAdmin.value || hasPermission('production:create'));

const isReadOnly = computed(() => {
  return props.initialData?.status === 'SUBMITTED';
});

const canRevert = computed(() => isReadOnly.value && canApprove.value);

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

// Update form data when date object changes
watch(productionDateObject, (newVal) => {
  if (newVal) {
    form.productionDate = newVal.toString();
  }
});

const lotNoPrefix = computed(() => {
  if (!form.grade || !form.productionDate) return '';

  // Grade: last 2 characters (e.g., STR20 -> 20)
  const gradeSuffix = form.grade.slice(-2);

  // Date parsing
  const date = new Date(form.productionDate);
  if (isNaN(date.getTime())) return '';

  // Year: last 2 digits (e.g., 2026 -> 26)
  const yearSuffix = date.getFullYear().toString().slice(-2);

  // Day: 2 digits with leading zero (e.g., 2 -> 02)
  const daySuffix = date.getDate().toString().padStart(2, '0');

  return `${gradeSuffix}${yearSuffix}${daySuffix}`;
});

const addRow = () => {
  form.rows.push({
    startTime: '',
    palletType: 'Blue',
    lotNo: lotNoPrefix.value,
    weight1: 35,
    weight2: 35,
    weight3: 35,
    weight4: 35,
    weight5: 35,
    sampleCount: 18,
  });
};

const removeRow = (index: number) => {
  form.rows.splice(index, 1);
};

const totalSample = computed(() => {
  return form.rows.reduce(
    (sum, row) => sum + (parseFloat(row.sampleCount?.toString() || '0') || 0),
    0
  );
});

// Manual Accumulated Samples editing is now enabled.
// Removing the auto-calculation logic based on totalSample.

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

const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
  try {
    form.status = status;
    if (props.initialData?.id || form.id) {
      const data = await productionReportsApi.update(
        props.initialData?.id || (form.id as string),
        form
      );
      Object.assign(form, data);
      toast.success(t('common.updateSuccess'));
    } else {
      const data = await productionReportsApi.create(form);
      Object.assign(form, data);
      form.id = data.id;
      toast.success(t('common.saveSuccess'));
    }

    if (status === 'SUBMITTED') {
      emit('saved');
    }
  } catch (error: any) {
    console.error('Failed to save report:', error);
    toast.error(error.response?.data?.message || t('common.errorSave'));
  }
};

const handleDelete = async () => {
  if (!props.initialData?.id) return;
  try {
    await productionReportsApi.delete(props.initialData.id);
    toast.success(t('common.deleteSuccess'));
    emit('saved'); // Refresh list
  } catch (error) {
    console.error('Failed to delete report', error);
    toast.error(t('common.error'));
  }
};

const handleRevertToDraft = async () => {
  if (!props.initialData?.id) return;
  try {
    await productionReportsApi.update(props.initialData.id, {
      ...form,
      status: 'DRAFT',
    });
    toast.success(t('common.updateSuccess'));
    emit('saved');
  } catch (error: any) {
    console.error('Failed to revert report:', error);
    toast.error(error.response?.data?.message || t('common.errorSave'));
  }
};

onMounted(() => {
  if (props.initialData) {
    Object.assign(form, props.initialData);
    if (typeof form.productionDate === 'string') {
      form.productionDate = form.productionDate.split('T')[0];
    }
  } else {
    // Add 1 empty row by default
    for (let i = 0; i < 1; i++) addRow();

    // Auto-fill Issued By with current user name
    if (authStore.user) {
      form.issuedBy = `${authStore.user.firstName} ${authStore.user.lastName || ''}`.trim();
    }
  }
});

// Auto-calculate Sample Count based on last filled pallet weight
// Hardcoded sample values: [4, 7, 11, 14, 18]
const SAMPLE_ACCUM_VALUES = [4, 7, 11, 14, 18];

watch(
  [() => form.rows],
  () => {
    form.rows.forEach((row) => {
      let lastPalletIndex = 0;
      if (parseFloat(row.weight5?.toString() || '0') > 0) lastPalletIndex = 5;
      else if (parseFloat(row.weight4?.toString() || '0') > 0) lastPalletIndex = 4;
      else if (parseFloat(row.weight3?.toString() || '0') > 0) lastPalletIndex = 3;
      else if (parseFloat(row.weight2?.toString() || '0') > 0) lastPalletIndex = 2;
      else if (parseFloat(row.weight1?.toString() || '0') > 0) lastPalletIndex = 1;

      if (lastPalletIndex > 0) {
        row.sampleCount = SAMPLE_ACCUM_VALUES[lastPalletIndex - 1];
      }
    });
  },
  { deep: true }
);

// Watch for Grade or Date changes to update existing row lot prefixes
watch(lotNoPrefix, (newPrefix, oldPrefix) => {
  if (!newPrefix) return;

  form.rows.forEach((row) => {
    // Only update if it was empty OR matched the previous prefix exactly
    // (Prevents overwriting manual entries like "202602/1")
    if (!row.lotNo || (oldPrefix && row.lotNo === oldPrefix)) {
      row.lotNo = newPrefix;
    }
  });
});
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <Card class="flex-1 flex flex-col overflow-hidden border-none shadow-none bg-transparent">
      <CardContent class="flex-1 overflow-y-auto p-1 space-y-6 pr-2">
        <fieldset :disabled="isReadOnly" class="space-y-6 block disabled:opacity-100">
          <!-- Header Info -->
          <div
            class="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border shadow-sm"
          >
            <div class="space-y-2">
              <Label>{{ t('production.productionDate') }}</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="w-full justify-center text-center font-normal bg-white h-10 border-input"
                    :class="!productionDateObject && 'text-muted-foreground'"
                    :disabled="isReadOnly"
                  >
                    <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
                    {{
                      productionDateObject
                        ? df.format(productionDateObject.toDate(getLocalTimeZone()))
                        : 'Pick a date'
                    }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar v-model="productionDateObject as any" initial-focus />
                </PopoverContent>
              </Popover>
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.shift') }}</Label>
              <Select v-model="form.shift" :disabled="isReadOnly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">{{ t('production.shifts.first') }}</SelectItem>
                  <SelectItem value="2nd">{{ t('production.shifts.second') }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.grade') }}</Label>
              <Select v-model="form.grade" :disabled="isReadOnly">
                <SelectTrigger>
                  <SelectValue placeholder="e.g. H0276" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0263">P0263</SelectItem>
                  <SelectItem value="P0251">P0251</SelectItem>
                  <SelectItem value="H0276">H0276</SelectItem>
                  <SelectItem value="P0241">P0241</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2 col-span-1">
              <Label class="text-xs">{{ t('production.ratio') }} (CL / USS / Cut)</Label>
              <div class="flex items-center gap-2 h-10">
                <div class="flex-1 relative">
                  <KeypadInput
                    v-model="form.ratioCL"
                    :title="t('production.ratioCL')"
                    :disabled="isReadOnly"
                    button-class="h-9 px-2 text-xs text-center"
                    :max-length="2"
                  />
                </div>
                <div class="flex-1 relative">
                  <KeypadInput
                    v-model="form.ratioUSS"
                    :title="t('production.ratioUSS')"
                    :disabled="isReadOnly"
                    button-class="h-9 px-2 text-xs text-center"
                    :max-length="2"
                  />
                </div>
                <div class="flex-1 relative">
                  <KeypadInput
                    v-model="form.ratioCutting"
                    :title="t('production.ratioCutting')"
                    :disabled="isReadOnly"
                    button-class="h-9 px-2 text-xs text-center"
                    :max-length="2"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Accumulated Samples section removed as per instruction -->

          <!-- Table -->
          <div class="rounded-xl border shadow-sm bg-white overflow-hidden">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead class="w-24 whitespace-nowrap text-center">{{
                    t('production.table.startTime')
                  }}</TableHead>
                  <TableHead class="w-32 whitespace-nowrap text-center">{{
                    t('production.table.palletType')
                  }}</TableHead>
                  <TableHead class="w-40 whitespace-nowrap text-center">{{
                    t('production.table.lotNo')
                  }}</TableHead>
                  <TableHead v-for="i in 5" :key="i" class="text-center w-24 whitespace-nowrap">{{
                    t('production.pallet', { n: i })
                  }}</TableHead>
                  <TableHead class="w-24 text-center whitespace-nowrap">{{
                    t('production.table.sampleCount')
                  }}</TableHead>
                  <TableHead class="w-12 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(row, index) in form.rows" :key="index">
                  <TableCell class="text-center">
                    <div class="flex justify-center">
                      <Time24hPicker v-model="row.startTime" class="w-24" :disabled="isReadOnly" />
                    </div>
                  </TableCell>
                  <TableCell class="text-center">
                    <div class="flex justify-center">
                      <Select v-model="row.palletType" :disabled="isReadOnly">
                        <SelectTrigger class="h-8 w-28 text-center">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MB5">MB5</SelectItem>
                          <SelectItem value="MB4">MB4</SelectItem>
                          <SelectItem value="GPS">GPS</SelectItem>
                          <SelectItem value="Blue">Blue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell class="text-center">
                    <KeypadInput
                      v-model="row.lotNo"
                      :title="t('production.table.lotNo')"
                      button-class="h-8 text-center"
                      mode="lot-number"
                      :disabled="isReadOnly"
                      :prefix="lotNoPrefix"
                    />
                  </TableCell>
                  <TableCell class="text-center">
                    <KeypadInput
                      v-model="row.weight1"
                      :title="t('production.pallet', { n: 1 })"
                      button-class="h-8 text-center"
                      :disabled="isReadOnly"
                      :max-length="2"
                    />
                  </TableCell>
                  <TableCell class="text-center">
                    <KeypadInput
                      v-model="row.weight2"
                      :title="t('production.pallet', { n: 2 })"
                      button-class="h-8 text-center"
                      :disabled="isReadOnly"
                      :max-length="2"
                    />
                  </TableCell>
                  <TableCell class="text-center">
                    <KeypadInput
                      v-model="row.weight3"
                      :title="t('production.pallet', { n: 3 })"
                      button-class="h-8 text-center"
                      :disabled="isReadOnly"
                      :max-length="2"
                    />
                  </TableCell>
                  <TableCell class="text-center">
                    <KeypadInput
                      v-model="row.weight4"
                      :title="t('production.pallet', { n: 4 })"
                      button-class="h-8 text-center"
                      :disabled="isReadOnly"
                      :max-length="2"
                    />
                  </TableCell>
                  <TableCell class="text-center">
                    <KeypadInput
                      v-model="row.weight5"
                      :title="t('production.pallet', { n: 5 })"
                      button-class="h-8 text-center"
                      :disabled="isReadOnly"
                      :max-length="2"
                    />
                  </TableCell>
                  <TableCell class="text-center">
                    <div
                      class="h-8 w-full flex items-center justify-center font-bold text-slate-700 bg-slate-50/50 border rounded-md"
                    >
                      {{ row.sampleCount }}
                    </div>
                  </TableCell>
                  <TableCell class="text-center">
                    <AlertDialog v-if="!isReadOnly">
                      <AlertDialogTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-destructive hover:bg-destructive/10 mx-auto flex"
                        >
                          <Trash2 class="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{{ t('common.deleteConfirm') }}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {{ t('common.deleteConfirmMessage') }}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                          <AlertDialogAction
                            @click="removeRow(index)"
                            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {{ t('common.delete') }}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div class="p-2 border-t bg-muted/10" v-if="!isReadOnly">
              <Button
                variant="ghost"
                size="sm"
                @click="addRow"
                class="gap-2 text-muted-foreground hover:text-primary"
              >
                <Plus class="h-4 w-4" />
                {{ t('common.add') }}
              </Button>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-white p-6 rounded-xl border shadow-sm space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label>{{ t('production.footer.baleBagLotNo') }}</Label>
                  <KeypadInput
                    v-model="form.baleBagLotNo"
                    :title="t('production.footer.baleBagLotNo')"
                    placeholder="PE 9.12.67, 25.1.68..."
                    mode="lot-number"
                    :disabled="isReadOnly"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    class="flex items-center gap-4 p-4 border rounded-xl bg-blue-50/50 border-blue-100"
                  >
                    <div
                      class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl"
                    >
                      {{ totalSample }}
                    </div>
                    <div>
                      <div class="text-[10px] font-bold text-foreground">
                        {{ t('production.totalSamples') }}
                      </div>
                    </div>
                  </div>

                  <div
                    class="flex items-center gap-4 p-4 border rounded-xl bg-green-50/50 border-green-100"
                  >
                    <div
                      class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl"
                    >
                      {{ totalPallets }}
                    </div>
                    <div>
                      <div class="text-[10px] font-bold text-foreground">
                        {{ t('production.stats.totalPallets') }}
                      </div>
                    </div>
                  </div>

                  <div
                    class="flex items-center gap-4 p-4 border rounded-xl bg-orange-50/50 border-orange-100"
                  >
                    <div
                      class="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl"
                    >
                      {{ totalBales }}
                    </div>
                    <div>
                      <div class="text-[10px] font-bold text-foreground">
                        {{ t('production.stats.totalBales') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <Label>{{ t('production.footer.issuedBy') }}</Label>
                  <Input v-model="form.issuedBy" />
                </div>
                <div class="space-y-2">
                  <Label>{{ t('production.footer.checkedBy') }}</Label>
                  <Input v-model="form.checkedBy" />
                </div>
                <div class="space-y-2 col-span-2">
                  <Label>{{ t('production.footer.judgedBy') }}</Label>
                  <Input v-model="form.judgedBy" />
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4 border-t">
          <!-- Left: Delete & Submit (Move Submit to Left) -->
          <div class="flex items-center gap-3">
            <template v-if="!isReadOnly">
              <!-- Delete Button -->
              <AlertDialog v-if="(props.initialData?.id || form.id) && canDelete">
                <AlertDialogTrigger as-child>
                  <Button variant="ghost" class="text-destructive hover:bg-destructive/10 gap-2">
                    <Trash2 class="h-4 w-4" />
                    {{ t('common.delete') }}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{{ t('common.deleteConfirm') }}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {{ t('common.deleteWarning') }}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                    <AlertDialogAction
                      @click="handleDelete"
                      class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {{ t('common.delete') }}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <!-- Submit Button (Enabled only if saved as draft once) -->
              <Button
                v-if="props.initialData?.id || form.id"
                @click="handleSave('SUBMITTED')"
                class="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 gap-2"
                :disabled="!canUpdate"
              >
                <Check class="h-4 w-4" />
                {{ t('production.submitReport') }}
              </Button>
            </template>

            <Button
              v-if="isReadOnly && canRevert"
              variant="outline"
              @click="handleRevertToDraft"
              class="gap-2"
            >
              Revert to Draft
            </Button>
          </div>

          <!-- Right: Back & Save Draft -->
          <div class="flex items-center gap-3">
            <Button variant="ghost" @click="emit('cancel')">
              {{ t('common.back') }}
            </Button>

            <Button
              v-if="
                !isReadOnly &&
                ((props.initialData?.id && canUpdate) || (!props.initialData?.id && canCreate))
              "
              variant="outline"
              @click="handleSave('DRAFT')"
              class="bg-white border-slate-200 shadow-sm"
            >
              {{ t('production.saveDraft') }}
            </Button>
          </div>
        </div>

        <!-- Bottom Spacer -->
        <div class="h-20"></div>
      </CardContent>
    </Card>
  </div>
</template>
