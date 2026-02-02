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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi } from '@/services/rubberTypes';
import { useAuthStore } from '@/stores/auth';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Layers,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Route Params & Query
const bookingId = route.params.id as string;
const isTrailer = route.query.isTrailer === 'true';

// State
const booking = ref<any>(null);
const samples = ref<any[]>([]);
const rubberTypes = ref<any[]>([]);

const originalLotNo = ref('');
const lotNoError = ref('');
const isLoading = ref(false);
const isSaving = ref(false);

const isDrcOpen = ref(false);
const isBeforeDryerOpen = ref(false);

const isWeightsOpen = ref(false);
const showSaveConfirm = ref(false);
const showDeleteConfirm = ref(false);

const originalSampleData = ref<Record<string, any>>({});
const sampleToDeleteId = ref<string | null>(null);
const sampleToDeleteIndex = ref<number | null>(null);
const isDeleting = ref(false);
const editingSampleId = ref<string | null>(null);

const weightForm = ref({
  weightIn: '',
  weightOut: '',
});

watch(isWeightsOpen, (newVal) => {
  if (newVal && booking.value) {
    weightForm.value = {
      weightIn:
        (isTrailer ? booking.value.trailerWeightIn : booking.value.weightIn)?.toString() || '',
      weightOut:
        (isTrailer ? booking.value.trailerWeightOut : booking.value.weightOut)?.toString() || '',
    };
  }
});

const toggleEdit = async (sample: any) => {
  const id = sample.id;
  const isEditing = editingSampleId.value === id;

  if (isEditing) {
    // Saving
    editingSampleId.value = null;
    delete originalSampleData.value[id];
    // Optional: Trigger save here if needed
  } else {
    // Starting edit
    originalSampleData.value[id] = { ...sample };
    editingSampleId.value = id;

    await nextTick();
    const targetRow = document.querySelector(`[data-row-id="${id}"]`);
    if (targetRow) {
      const firstInput = targetRow.querySelector('input:not([readonly])') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }
  }
};

const cancelEdit = (sample: any) => {
  const id = sample.id;
  if (originalSampleData.value[id]) {
    Object.assign(sample, originalSampleData.value[id]);
    delete originalSampleData.value[id];
  }
  editingSampleId.value = null;
};

const drcForm = ref({
  drcEst: '',
  drcRequested: '',
  drcActual: '',
});

const drcReqRef = ref<any>(null);
const drcActualRef = ref<any>(null);

const onDrcKeydown = (e: KeyboardEvent, nextField: 'req' | 'actual' | 'save') => {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();

    if (nextField === 'save') {
      handleSaveDrc();
      return;
    }

    const targetRef = nextField === 'req' ? drcReqRef : drcActualRef;
    if (targetRef.value) {
      const el =
        targetRef.value.$el?.querySelector('input') || targetRef.value.$el || targetRef.value;
      if (el) {
        el.focus();
        if (el.select) el.select();
      }
    }
  }
};

watch(isDrcOpen, (newVal) => {
  if (newVal && booking.value) {
    drcForm.value = {
      drcEst: booking.value.drcEst || '',
      drcRequested: booking.value.drcRequested || '',
      drcActual: booking.value.drcActual || '',
    };
  }
});

const beforeDryerForm = ref({
  moisture: '',
});

watch(isBeforeDryerOpen, (newVal) => {
  if (newVal && booking.value) {
    const val = isTrailer ? booking.value.trailerMoisture : booking.value.moisture;
    beforeDryerForm.value = {
      moisture: val ? val.toString() : '',
    };
  }
});

// New Sample Form (Batch)
const newSamples = ref<any[]>([]);

const addNewSampleRow = async () => {
  const tempId = 'temp-' + Date.now();

  const allSamples = [...samples.value, ...newSamples.value];
  const lastSample = allSamples[allSamples.length - 1];
  const previousStorage = lastSample?.storage || '';

  newSamples.value.push({
    id: tempId,
    totalWeight: '',
    palletWeight: '',
    grossWeight: '',
    spgr: '',
    storage: previousStorage,
    recordedBy:
      authStore.user?.displayName || authStore.user?.firstName || authStore.user?.username || '-',
  });

  await nextTick();
  const targetRow = document.querySelector(`[data-row-id="${tempId}"]`);
  if (targetRow) {
    const firstInput = targetRow.querySelector('input') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }
};

const populatedCount = computed(() => {
  const allSamples = [...samples.value, ...newSamples.value];
  return allSamples.filter((s) => s.totalWeight || s.palletWeight || s.spgr).length;
});

const removeNewSampleRow = (index: number) => {
  sampleToDeleteIndex.value = index;
  showDeleteConfirm.value = true;
};

const focusNextInput = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  const inputs = Array.from(
    document.querySelectorAll(
      'input:not([readonly]):not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([readonly]):not([disabled])'
    )
  ) as HTMLElement[];
  const currentIndex = inputs.indexOf(target);

  if (currentIndex >= 0) {
    const nextIndex = currentIndex + 1;
    if (nextIndex < inputs.length) {
      event.preventDefault();
      inputs[nextIndex].focus();
    } else {
      // Last input logic is now handled by specific handler on the last field,
      // but if we fall through here, just save.
      const isLastField = currentIndex === inputs.length - 1;
      if (isLastField) {
        // Prevent default only if we are handling it
        // event.preventDefault();
        // handleSaveAllSamples();
      }
    }
  }
};

const formatNumber = (value: number | string, decimals = 0) => {
  if (value === '' || value === null || value === undefined) return '';
  const valStr = value.toString();
  // Remove existing commas to ensure parseFloat works correctly
  const cleanVal = valStr.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleanVal);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatNumberCommas = (value: string) => {
  if (!value) return '';
  const parts = value.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const parseRaw = (val: string | number) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
};

const displayRubberType = computed(() => {
  if (!booking.value) return '-';
  const code = isTrailer ? booking.value.trailerRubberType : booking.value.rubberType;
  // Assume 'grade' or 'trailerGrade' exists on booking object
  const grade = isTrailer ? (booking.value as any).trailerGrade : (booking.value as any).grade;

  const type = rubberTypes.value.find((t) => t.code === code);
  let displayText = type ? type.name : code || '-';

  if (grade) {
    displayText += ` | ${grade}`;
  } else {
    displayText += ` | -`;
  }
  return displayText;
});

const displayGrossWeight = computed(() => {
  if (!booking.value) return '-';
  const inW = isTrailer ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  const outW = isTrailer ? booking.value.trailerWeightOut || 0 : booking.value.weightOut || 0;
  const net = inW - outW;
  return (net > 0 ? net : 0).toLocaleString();
});

const displayNetWeight = computed(() => {
  if (!booking.value) return '0';
  const inW = isTrailer ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  const outW = isTrailer ? booking.value.trailerWeightOut || 0 : booking.value.weightOut || 0;
  const gross = Math.max(0, inW - outW);
  const drc = parseFloat(booking.value.drcActual) || 0;

  if (gross === 0 || drc === 0) return '0';

  const dryWeight = Math.round(gross * (drc / 100));
  return dryWeight.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
});

const displayBeforeDryer = computed(() => {
  if (!booking.value) return '-';
  const val = isTrailer ? booking.value.trailerMoisture : booking.value.moisture;
  return val ? val.toFixed(1) : '-';
});

const handleNumericInput = (sample: any, field: string, value: string) => {
  let cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // Format with commas if field is weight
  if (['totalWeight', 'palletWeight'].includes(field)) {
    cleaned = formatNumberCommas(cleaned);
  }

  sample[field] = cleaned;

  if (['totalWeight', 'palletWeight'].includes(field)) {
    calculateGrossWeight(sample);
  }
};

const calculateGrossWeight = (sample: any) => {
  const total = parseRaw(sample.totalWeight || '0');
  const pallet = parseRaw(sample.palletWeight || '0');

  if (total && pallet) {
    const gross = total - pallet;
    // Round to integer and format
    sample.grossWeight = gross > 0 ? Math.round(gross).toLocaleString('en-US') : '0';
  } else {
    sample.grossWeight = '';
  }
};

const fetchData = async (silent = false) => {
  if (!bookingId) return;
  if (!silent) isLoading.value = true;
  try {
    const [bookingData, samplesData, typesData] = await Promise.all([
      bookingsApi.getById(bookingId),
      bookingsApi.getSamples(bookingId),
      rubberTypesApi.getAll(),
    ]);

    booking.value = {
      ...bookingData,
      lotNo: isTrailer ? bookingData.trailerLotNo || '' : bookingData.lotNo || '',
      moisture: isTrailer ? bookingData.trailerMoisture || 0 : bookingData.moisture || 0,
      drcEst: isTrailer ? bookingData.trailerDrcEst || 0 : bookingData.drcEst || 0,
      drcRequested: isTrailer
        ? bookingData.trailerDrcRequested || 0
        : bookingData.drcRequested || 0,
      drcActual: isTrailer ? bookingData.trailerDrcActual || 0 : bookingData.drcActual || 0,
    };
    originalLotNo.value = booking.value.lotNo;
    samples.value = samplesData
      .filter((s: any) => s.isTrailer === isTrailer)
      .map((s: any) => {
        const total = s.beforePress ? parseFloat(s.beforePress) : 0;
        const pallet = s.basketWeight ? parseFloat(s.basketWeight) : 0;
        const gross = total - pallet;

        return {
          ...s,
          totalWeight: s.beforePress ? formatNumberCommas(s.beforePress.toString()) : '',
          palletWeight: s.basketWeight ? formatNumberCommas(s.basketWeight.toString()) : '',
          grossWeight: gross > 0 ? Math.round(gross).toLocaleString('en-US') : '',
          spgr: s.percentCp?.toString() || '',
          storage: s.storage || '',
          recordedBy: s.recordedBy || '',
        };
      });
    rubberTypes.value = typesData;
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

const saveHeaderInfoOnly = async () => {
  isSaving.value = true;
  try {
    const updateData: any = {};
    if (isTrailer) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerMoisture = booking.value.moisture;
      updateData.trailerDrcEst = booking.value.drcEst;
      updateData.trailerDrcRequested = booking.value.drcRequested;
      updateData.trailerDrcActual = booking.value.drcActual;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.moisture = booking.value.moisture;
      updateData.drcEst = booking.value.drcEst;
      updateData.drcRequested = booking.value.drcRequested;
      updateData.drcActual = booking.value.drcActual;
    }

    await bookingsApi.update(bookingId, updateData);
    toast.success(t('common.saved'));
    await bookingsApi.update(bookingId, updateData);
    toast.success(t('common.saved'));
    fetchData(true); // Silent refresh
  } catch (error) {
    console.error('Failed to save header info:', error);
    toast.error(t('common.errorSaving'));
  } finally {
    isSaving.value = false;
  }
};

const handleSaveAllSamples = async (): Promise<boolean> => {
  const allSamples = [...samples.value, ...newSamples.value];
  const populatedSamples = allSamples.filter((s) => s.totalWeight || s.palletWeight);

  const allValid = populatedSamples.every((s) => s.totalWeight && s.palletWeight);

  if (populatedSamples.length > 0 && !allValid) {
    toast.error(t('uss.enterRequiredFields'));
    return false;
  }

  if (populatedSamples.length === 0) {
    await saveHeaderInfoOnly();
    return true;
  }

  showSaveConfirm.value = true;
  // Return a promise that resolves when the dialog is confirmed or cancelled?
  // Actually, showSaveConfirm opens a dialog. We can't return true immediately unless we change the flow
  // to be synchronous or wait for the dialog.
  // HOWEVER, the user asked for "Enter -> Save and new row".
  // If we show a confirmation dialog every time, it defeats the purpose of "Enter key quick add".
  // Maybe we should skip confirmation for the "Quick Add" flow?
  // Or just return false here and let the dialog confirm action trigger the next steps?
  // Let's refactor: If invoked via Enter key, maybe skip confirmation if data is valid?
  // For now, let's keep it simple: The requirement implies a seamless flow.
  // I will add a `skipConfirm` parameter.
  return false;
};

// Refactored with skipConfirm
const saveSamplesDirectly = async () => {
  const allSamples = [...samples.value, ...newSamples.value];
  const populatedSamples = allSamples.filter((s) => s.totalWeight || s.palletWeight || s.spgr);

  if (populatedSamples.length === 0) return true;

  isSaving.value = true;
  try {
    for (const sample of populatedSamples) {
      if (!sample.grossWeight) calculateGrossWeight(sample);

      await bookingsApi.saveSample(bookingId, {
        ...sample,
        beforePress: parseRaw(sample.totalWeight),
        afterPress: parseRaw(sample.grossWeight),
        percentCp: parseFloat(sample.spgr || '0'),
        basketWeight: parseRaw(sample.palletWeight),
        storage: sample.storage,
        recordedBy:
          sample.recordedBy ||
          authStore.user?.displayName ||
          authStore.user?.firstName ||
          authStore.user?.username ||
          '-',
        isTrailer: isTrailer,
      });
    }
    const updateData: any = {};
    if (isTrailer) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerMoisture = booking.value.moisture;
      updateData.trailerDrcEst = booking.value.drcEst;
      updateData.trailerDrcRequested = booking.value.drcRequested;
      updateData.trailerDrcActual = booking.value.drcActual;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.moisture = booking.value.moisture;
      updateData.drcEst = booking.value.drcEst;
      updateData.drcRequested = booking.value.drcRequested;
      updateData.drcActual = booking.value.drcActual;
    }

    updateData.silent = true;
    await bookingsApi.update(bookingId, updateData);

    toast.success(t('uss.sampleSaved'));
    newSamples.value = [];
    await fetchData(true); // Silent refresh
    return true;
  } catch (error: any) {
    console.error('Failed to save samples:', error);
    toast.error(error.response?.data?.message || t('uss.failedToSave'));
    return false;
  } finally {
    isSaving.value = false;
  }
};

const handleEnterOnLastFieldLogic = async (event: KeyboardEvent) => {
  event.preventDefault();
  // This calls the direct save method, bypassing the confirmation dialog for speed
  const success = await saveSamplesDirectly();
  if (success) {
    await addNewSampleRow();
  }
};

const confirmSaveSamples = async () => {
  showSaveConfirm.value = false;

  const allSamples = [...samples.value, ...newSamples.value];
  const populatedSamples = allSamples.filter((s) => s.totalWeight || s.palletWeight || s.spgr);

  isSaving.value = true;
  try {
    for (const sample of populatedSamples) {
      if (!sample.grossWeight) calculateGrossWeight(sample);

      await bookingsApi.saveSample(bookingId, {
        ...sample,
        beforePress: parseRaw(sample.totalWeight),
        afterPress: parseRaw(sample.grossWeight),
        percentCp: parseFloat(sample.spgr || '0'),
        basketWeight: parseRaw(sample.palletWeight),
        storage: sample.storage,
        recordedBy:
          sample.recordedBy ||
          authStore.user?.displayName ||
          authStore.user?.firstName ||
          authStore.user?.username ||
          '-',
        isTrailer: isTrailer,
      });
    }

    const updateData: any = {};
    if (isTrailer) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerMoisture = booking.value.moisture;
      updateData.trailerDrcEst = booking.value.drcEst;
      updateData.trailerDrcRequested = booking.value.drcRequested;
      updateData.trailerDrcActual = booking.value.drcActual;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.moisture = booking.value.moisture;
      updateData.drcEst = booking.value.drcEst;
      updateData.drcRequested = booking.value.drcRequested;
      updateData.drcActual = booking.value.drcActual;
    }

    updateData.silent = true;
    await bookingsApi.update(bookingId, updateData);

    toast.success(t('uss.sampleSaved'));
    newSamples.value = [];
    fetchData(true);
  } catch (error: any) {
    console.error('Failed to save samples:', error);
    toast.error(error.response?.data?.message || t('uss.failedToSave'));
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteSample = (sampleId: string) => {
  sampleToDeleteId.value = sampleId;
  showDeleteConfirm.value = true;
};

const confirmDeleteSample = async () => {
  if (sampleToDeleteIndex.value !== null) {
    // Delete new/local sample
    // Assuming 'newSamples' is defined elsewhere and accessible here
    // If newSamples is not defined, this line will cause an error.
    // The user's snippet implies its existence.
    // newSamples.value.splice(sampleToDeleteIndex.value, 1);
    showDeleteConfirm.value = false;
    sampleToDeleteIndex.value = null;
    return;
  }

  if (!sampleToDeleteId.value) return;

  isDeleting.value = true;
  try {
    await bookingsApi.deleteSample(bookingId, sampleToDeleteId.value);
    toast.success(t('uss.sampleDeleted'));
    await fetchData(true);
  } catch (e) {
    toast.error(t('uss.failedToDelete'));
  } finally {
    isDeleting.value = false;
    showDeleteConfirm.value = false;
    sampleToDeleteId.value = null;
  }
};

const lotNoPrefix = computed(() => {
  const dateStr =
    booking.value?.date || booking.value?.entryDate || booking.value?.createdAt || new Date();
  const now = new Date(dateStr);

  if (isNaN(now.getTime())) return '';

  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  return `2${yy}${mm}${dd}-`;
});

const lotNoSuffix = computed({
  get() {
    if (!booking.value?.lotNo) return '';
    const prefix = lotNoPrefix.value;
    if (booking.value.lotNo.startsWith(prefix)) {
      return booking.value.lotNo.slice(prefix.length);
    }
    return booking.value.lotNo;
  },
  set(val: string) {
    if (!booking.value) return;
    booking.value.lotNo = lotNoPrefix.value + val;
  },
});

const validateLotInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const rawSuffix = input.value;
  const cleanedSuffix = rawSuffix.replace(/[^0-9/-]/g, '');

  if (rawSuffix !== cleanedSuffix) {
    lotNoError.value = t('uss.invalidChar') || 'Only numbers, / and - allowed';
    lotNoSuffix.value = cleanedSuffix;
    input.value = cleanedSuffix;
  } else {
    lotNoError.value = '';
    lotNoSuffix.value = cleanedSuffix;
  }
};

const handleUpdateLotNo = async () => {
  if (!booking.value) return;

  if (booking.value.lotNo && !/^[0-9/\-]+$/.test(booking.value.lotNo)) {
    lotNoError.value = t('uss.invalidChar') || 'Only numbers, / and - allowed';
    return;
  }

  if (!booking.value.lotNo || booking.value.lotNo === originalLotNo.value) {
    if (!booking.value.lotNo) booking.value.lotNo = originalLotNo.value;
    lotNoError.value = '';
    return;
  }

  // NOTE: Validation for duplicate can be added nicely here if we have an API for it.
  // For now, relies on backend constraint or user awareness.

  lotNoError.value = '';
  await saveHeaderInfoOnly();
  // Manually update originalLotNo after successful save in saveHeaderInfoOnly
};

const handleSaveDrc = async () => {
  if (!booking.value) return;

  try {
    const drcData = {
      drcEst: parseFloat(drcForm.value.drcEst) || 0,
      drcRequested: parseFloat(drcForm.value.drcRequested) || 0,
      drcActual: parseFloat(drcForm.value.drcActual) || 0,
    };

    const updateData: any = {
      lotNo: booking.value.lotNo,
      silent: true,
    };

    if (isTrailer) {
      updateData.trailerDrcEst = drcData.drcEst;
      updateData.trailerDrcRequested = drcData.drcRequested;
      updateData.trailerDrcActual = drcData.drcActual;
    } else {
      updateData.drcEst = drcData.drcEst;
      updateData.drcRequested = drcData.drcRequested;
      updateData.drcActual = drcData.drcActual;
    }

    await bookingsApi.update(bookingId, updateData);

    if (isTrailer) {
      booking.value.trailerDrcEst = drcData.drcEst;
      booking.value.trailerDrcRequested = drcData.drcRequested;
      booking.value.trailerDrcActual = drcData.drcActual;
    } else {
      booking.value.drcEst = drcData.drcEst;
      booking.value.drcRequested = drcData.drcRequested;
      booking.value.drcActual = drcData.drcActual;
    }

    toast.success(t('common.saved'));
  } catch (error) {
    console.error('Failed to update DRC:', error);
    toast.error(t('common.errorSaving'));
  }
  isDrcOpen.value = false;
};

const handleSaveBeforeDryer = async () => {
  if (!booking.value) return;

  try {
    const moisture = parseFloat(beforeDryerForm.value.moisture) || 0;
    const updateData: any = {
      lotNo: booking.value.lotNo,
      silent: true,
    };

    if (isTrailer) {
      updateData.trailerMoisture = moisture;
    } else {
      updateData.moisture = moisture;
    }

    await bookingsApi.update(bookingId, updateData);

    if (isTrailer) {
      booking.value.trailerMoisture = moisture;
    } else {
      booking.value.moisture = moisture;
    }

    toast.success(t('common.saved'));
  } catch (error) {
    console.error('Failed to update Before Dryer:', error);
    toast.error(t('common.errorSaving'));
  }
  isBeforeDryerOpen.value = false;
};

const handleSaveWeights = async () => {
  if (!booking.value) return;

  try {
    const wIn = parseFloat(weightForm.value.weightIn) || 0;
    const wOut = parseFloat(weightForm.value.weightOut) || 0;
    const updateData: any = { silent: true };

    if (isTrailer) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerWeightIn = wIn;
      updateData.trailerWeightOut = wOut;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.weightIn = wIn;
      updateData.weightOut = wOut;
    }

    await bookingsApi.update(bookingId, updateData);

    // Update local model
    if (isTrailer) {
      booking.value.trailerWeightIn = wIn;
      booking.value.trailerWeightOut = wOut;
    } else {
      booking.value.weightIn = wIn;
      booking.value.weightOut = wOut;
    }

    toast.success(t('common.saved'));
  } catch (error) {
    console.error('Failed to update Weights:', error);
    toast.error(t('common.errorSaving'));
  }
  isWeightsOpen.value = false;
};

onMounted(async () => {
  await fetchData();
  if (samples.value.length === 0 && newSamples.value.length === 0) {
    await addNewSampleRow();
  } else {
    await nextTick();
    const firstEditable = document.querySelector(
      'input:not([readonly]):not([disabled])'
    ) as HTMLInputElement;
    if (firstEditable) {
      firstEditable.focus();
      if (firstEditable.value) firstEditable.select();
    }
  }
});
</script>

<template>
  <div class="p-1 pt-0 space-y-2">
    <div v-if="isLoading" class="flex items-center justify-center p-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"
        ></div>
        <div class="text-sm font-medium text-muted-foreground">Loading information...</div>
      </div>
    </div>

    <template v-else-if="booking">
      <!-- Section 1: Header Info (Compact Design) -->
      <div
        class="rounded-lg border bg-white shadow-sm px-4 py-2 relative overflow-hidden flex flex-col items-start gap-2"
      >
        <div class="absolute top-1/2 right-0 -translate-y-1/2 pointer-events-none opacity-[0.03]">
          <Layers class="w-48 h-48 rotate-12" />
        </div>

        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between w-full">
          <!-- Supplier Info -->
          <div class="flex flex-col min-w-0 flex-1 mr-4">
            <div
              class="text-[0.625rem] text-muted-foreground font-bold uppercase tracking-widest mb-0.5"
            >
              {{ t('uss.supplier') }}
            </div>
            <h1 class="text-base font-bold tracking-tight truncate flex items-center gap-2">
              <span class="text-primary">{{ booking.supplierCode }}</span>
              <span class="text-muted-foreground/30 font-light">|</span>
              <span class="truncate">{{ booking.supplierName }}</span>
            </h1>
          </div>

          <!-- Lot No -->
          <div class="flex flex-col items-start min-w-[8rem]">
            <div
              class="text-[0.625rem] text-muted-foreground font-bold uppercase tracking-widest mb-0.5"
            >
              {{ t('uss.lotNo') }}
            </div>
            <div
              class="flex items-center w-40 h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus-within:ring-1 focus-within:ring-primary shadow-sm"
              :class="{
                'border-destructive focus-within:ring-destructive': lotNoError,
              }"
            >
              <span
                class="text-xs font-black text-slate-900 dark:text-slate-100 whitespace-nowrap select-none"
                >{{ lotNoPrefix }}</span
              >
              <input
                v-model="lotNoSuffix"
                type="text"
                class="w-full bg-transparent border-none focus:ring-0 text-xs font-black text-slate-900 dark:text-slate-100 p-0"
                placeholder="XXX/X"
                @input="validateLotInput"
                @blur="handleUpdateLotNo"
                @keydown.enter="
                  ($event.target as HTMLInputElement).blur();
                  handleUpdateLotNo();
                "
              />
            </div>
            <p v-if="lotNoError" class="text-[0.6rem] text-destructive mt-0.5 font-medium">
              {{ lotNoError }}
            </p>
          </div>
        </div>

        <!-- Metrics Grid (Compact) -->
        <div
          class="relative z-10 w-full border-t border-slate-100 pt-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2"
        >
          <!-- Rubber Type -->
          <div class="flex flex-col justify-center px-2 py-1 border rounded bg-slate-50/50">
            <div
              class="text-[0.5rem] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1"
            >
              {{ t('uss.rubberType') }}
            </div>
            <div class="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">
              {{ displayRubberType }}
            </div>
          </div>

          <!-- Est -->
          <div
            @click="isDrcOpen = true"
            class="cursor-pointer flex flex-col justify-center px-2 py-1 rounded border bg-teal-50/30 border-teal-100 hover:bg-teal-50 transition-colors"
          >
            <div
              class="text-[0.5rem] font-bold text-teal-600 uppercase tracking-wider leading-none mb-1"
            >
              EST.
            </div>
            <div class="text-xs font-black text-teal-700 leading-none">
              {{ formatNumber(booking.drcEst, 1) }}%
            </div>
          </div>

          <!-- Req -->
          <div
            @click="isDrcOpen = true"
            class="cursor-pointer flex flex-col justify-center px-2 py-1 rounded border bg-teal-50/30 border-teal-100 hover:bg-teal-50 transition-colors"
          >
            <div
              class="text-[0.5rem] font-bold text-teal-600 uppercase tracking-wider leading-none mb-1"
            >
              REQ.
            </div>
            <div class="text-xs font-black text-teal-700 leading-none">
              {{ formatNumber(booking.drcRequested, 1) }}%
            </div>
          </div>

          <!-- Actual -->
          <Popover v-model:open="isDrcOpen">
            <PopoverTrigger as-child>
              <div
                class="cursor-pointer flex flex-col justify-center px-2 py-1 rounded border bg-teal-50/50 border-teal-100 hover:bg-teal-100/50 transition-colors"
              >
                <div
                  class="text-[0.5rem] font-bold text-teal-600 uppercase tracking-wider leading-none mb-1"
                >
                  ACTUAL
                </div>
                <div class="text-xs font-black text-teal-700 leading-none">
                  {{ formatNumber(booking.drcActual, 1) }}%
                </div>
              </div>
            </PopoverTrigger>
            <!-- Popover Content (Same as before) -->
            <PopoverContent class="w-80">
              <div class="grid gap-4">
                <div class="space-y-2">
                  <h4 class="font-medium leading-none text-teal-700">DRC % Details</h4>
                  <p class="text-xs text-muted-foreground">
                    Adjust DRC estimated, requested, and actual values.
                  </p>
                </div>
                <div class="grid gap-3" @keydown.enter.stop>
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label for="drcEst" class="text-xs uppercase font-bold text-teal-600">{{
                      t('uss.drcEst')
                    }}</Label>
                    <Input
                      id="drcEst"
                      v-model="drcForm.drcEst"
                      type="number"
                      step="0.01"
                      class="col-span-2 h-8 font-bold"
                      @keydown.enter.prevent.stop="onDrcKeydown($event, 'req')"
                    />
                  </div>
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label for="drcReq" class="text-xs uppercase font-bold text-teal-600"
                      >DRC Req.</Label
                    >
                    <Input
                      ref="drcReqRef"
                      id="drcReq"
                      v-model="drcForm.drcRequested"
                      type="number"
                      step="0.01"
                      class="col-span-2 h-8 font-bold"
                      @keydown.enter.prevent.stop="onDrcKeydown($event, 'actual')"
                    />
                  </div>
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label for="drcActual" class="text-xs uppercase font-bold text-teal-600"
                      >DRC Actual</Label
                    >
                    <Input
                      ref="drcActualRef"
                      id="drcActual"
                      v-model="drcForm.drcActual"
                      type="number"
                      step="0.01"
                      class="col-span-2 h-8 font-bold"
                      @keydown.enter.prevent.stop="onDrcKeydown($event, 'save')"
                    />
                  </div>
                </div>
                <div class="flex justify-end pt-2 border-t mt-2">
                  <Button
                    type="button"
                    size="sm"
                    class="h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                    @click="handleSaveDrc()"
                  >
                    <Save class="w-3.5 h-3.5" />
                    {{ t('common.save') }}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <!-- Before Dryer -->
          <Popover v-model:open="isBeforeDryerOpen">
            <PopoverTrigger as-child>
              <div
                class="cursor-pointer flex flex-col justify-center px-2 py-1 rounded border bg-blue-50/50 border-blue-100 hover:bg-blue-100/50 transition-colors"
              >
                <div
                  class="text-[0.5rem] font-bold text-blue-600 uppercase tracking-wider leading-none mb-1"
                >
                  {{ t('uss.beforeDryer') }}
                </div>
                <div class="text-xs font-black text-blue-700 leading-none">
                  {{ displayBeforeDryer }}<span v-if="displayBeforeDryer !== '-'">%</span>
                </div>
              </div>
            </PopoverTrigger>
            <!-- Popover Content (Same as before) -->
            <PopoverContent class="w-80">
              <div class="grid gap-4">
                <div class="space-y-2">
                  <h4 class="font-medium leading-none text-blue-700">Before Dryer %</h4>
                  <p class="text-xs text-muted-foreground">Adjust Before Dryer % value.</p>
                </div>
                <div class="grid gap-3" @keydown.enter.stop>
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label class="text-xs uppercase font-bold text-blue-600">Value %</Label>
                    <Input
                      v-model="beforeDryerForm.moisture"
                      type="number"
                      step="0.1"
                      class="col-span-2 h-8 font-bold"
                      @keydown.enter.prevent.stop="handleSaveBeforeDryer"
                    />
                  </div>
                  <div class="flex justify-end pt-2 border-t mt-2">
                    <Button
                      size="sm"
                      class="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                      @click="handleSaveBeforeDryer"
                    >
                      <Save class="w-3.5 h-3.5" />
                      {{ t('common.save') }}
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <!-- Weights & Net -->
          <Popover v-model:open="isWeightsOpen">
            <PopoverTrigger as-child>
              <div
                class="cursor-pointer flex flex-col justify-center px-2 py-1 rounded border bg-blue-50/30 border-blue-100 hover:bg-blue-50 transition-colors group"
              >
                <span
                  class="text-[0.5rem] font-bold text-blue-600 uppercase tracking-tighter leading-none mb-1 flex items-center gap-1"
                  >{{ t('uss.grossWeight') }}
                  <Pencil
                    class="w-2 h-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                /></span>
                <div class="flex items-baseline gap-1">
                  <span class="text-xs font-black text-blue-700 leading-none">{{
                    displayGrossWeight
                  }}</span>
                  <span class="text-[0.5rem] text-muted-foreground font-bold">Kg</span>
                </div>
              </div>
            </PopoverTrigger>
            <!-- Popover Content (Same as before) -->
            <PopoverContent class="w-80">
              <div class="grid gap-4">
                <div class="space-y-2">
                  <h4 class="leading-none text-blue-700 font-bold uppercase tracking-tight">
                    Weight Management
                  </h4>
                  <p class="text-xs text-muted-foreground">Adjust inbound and outbound weights.</p>
                </div>
                <div class="grid gap-3">
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label class="text-xs uppercase font-bold text-slate-600">{{
                      t('uss.weightIn')
                    }}</Label>
                    <Input
                      v-model="weightForm.weightIn"
                      type="number"
                      class="col-span-2 h-8 font-bold"
                    />
                  </div>
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label class="text-xs uppercase font-bold text-slate-600">{{
                      t('uss.weightOut')
                    }}</Label>
                    <Input
                      v-model="weightForm.weightOut"
                      type="number"
                      class="col-span-2 h-8 font-bold"
                      @keydown.enter="handleSaveWeights"
                    />
                  </div>
                  <div class="pt-2 border-t flex justify-end">
                    <Button
                      size="sm"
                      class="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                      @click="handleSaveWeights"
                    >
                      <Save class="w-3.5 h-3.5" />
                      {{ t('common.save') }}
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div
            class="flex flex-col justify-center px-2 py-1 rounded border bg-green-50/50 border-green-100"
          >
            <span
              class="text-[0.5rem] font-bold text-green-600 uppercase tracking-tighter leading-none mb-1"
              >{{ t('uss.netWeight') }}</span
            >
            <div class="flex items-baseline gap-1">
              <span class="text-xs font-black text-green-700 leading-none">{{
                displayNetWeight
              }}</span>
              <span v-if="displayNetWeight" class="text-[0.5rem] text-muted-foreground font-bold"
                >Kg</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Recorded Items Table (Card 3) -->
      <Card class="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent class="p-2">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-400">
                  {{ t('uss.recordedItems') }}
                </h3>
                <Badge variant="secondary" class="h-5 px-1.5 text-[0.625rem] font-bold">
                  {{ populatedCount }}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="default"
                @click="addNewSampleRow"
                class="h-7 gap-1 px-3 text-[0.625rem] font-bold bg-blue-600 hover:bg-blue-700"
              >
                <Plus class="w-3 h-3" />
                Add Pallet
              </Button>
            </div>

            <div
              class="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm"
            >
              <Table>
                <TableHeader class="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableRow class="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead class="w-[80px] text-[0.625rem] font-black uppercase text-center">{{
                      t('uss.palletNumber')
                    }}</TableHead>
                    <TableHead class="text-[0.625rem] font-black uppercase text-center">{{
                      t('uss.totalWeight')
                    }}</TableHead>
                    <TableHead class="text-[0.625rem] font-black uppercase text-center">{{
                      t('uss.palletWeight')
                    }}</TableHead>
                    <TableHead
                      class="text-[0.625rem] font-black uppercase text-center text-blue-600"
                      >{{ t('uss.grossWeight') }}</TableHead
                    >
                    <TableHead class="text-[0.625rem] font-black uppercase text-center">{{
                      t('uss.spgr')
                    }}</TableHead>
                    <TableHead class="text-[0.625rem] font-black uppercase text-center">{{
                      t('uss.storage') || 'Storage'
                    }}</TableHead>
                    <TableHead class="text-[0.625rem] font-black uppercase text-center">{{
                      t('uss.recordedBy') || 'Recorded By'
                    }}</TableHead>
                    <TableHead class="w-[100px] text-[0.625rem] font-black uppercase text-center"
                      >Action</TableHead
                    >
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <!-- Existing Samples -->
                  <TableRow
                    v-for="(sample, index) in samples"
                    :key="sample.id"
                    :data-row-id="sample.id"
                    class="group border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/30 transition-colors"
                  >
                    <TableCell class="text-center font-bold text-xs text-slate-400">
                      {{ index + 1 }}
                    </TableCell>

                    <!-- Total Weight -->
                    <TableCell class="py-1 px-2 text-center">
                      <div v-if="editingSampleId === sample.id" class="flex justify-center">
                        <Input
                          v-model="sample.totalWeight"
                          class="h-8 w-24 text-center font-bold text-xs"
                          @input="handleNumericInput(sample, 'totalWeight', $event.target.value)"
                          @keydown.enter="focusNextInput"
                        />
                      </div>
                      <span v-else class="font-bold text-slate-900">{{
                        formatNumber(sample.totalWeight)
                      }}</span>
                    </TableCell>

                    <!-- Pallet Weight -->
                    <TableCell class="py-1 px-2 text-center">
                      <div v-if="editingSampleId === sample.id" class="flex justify-center">
                        <Input
                          v-model="sample.palletWeight"
                          class="h-8 w-24 text-center font-bold text-xs"
                          @input="handleNumericInput(sample, 'palletWeight', $event.target.value)"
                          @keydown.enter="focusNextInput"
                        />
                      </div>
                      <span v-else class="font-bold text-slate-600">{{
                        formatNumber(sample.palletWeight)
                      }}</span>
                    </TableCell>

                    <!-- Gross Weight (Calculated) -->
                    <TableCell class="py-1 px-2 text-center">
                      <span class="font-bold text-blue-600">{{ sample.grossWeight }}</span>
                    </TableCell>

                    <!-- SPGR -->
                    <TableCell class="py-1 px-2 text-center">
                      <div
                        v-if="editingSampleId === sample.id"
                        class="flex justify-center group/calc relative"
                      >
                        <Input
                          v-model="sample.spgr"
                          class="h-8 w-24 text-center font-bold text-xs text-green-600 bg-green-50"
                          @input="handleNumericInput(sample, 'spgr', $event.target.value)"
                          @keydown.enter="focusNextInput"
                        />
                      </div>
                      <span v-else class="font-bold text-green-600">{{ sample.spgr }}</span>
                    </TableCell>

                    <!-- Storage -->
                    <TableCell class="py-1 px-2 text-center">
                      <div v-if="editingSampleId === sample.id" class="flex justify-center">
                        <Input
                          v-model="sample.storage"
                          class="h-8 w-48 text-center font-bold text-xs"
                          @keydown.enter="handleEnterOnLastFieldLogic"
                        />
                      </div>
                      <span v-else class="font-bold text-slate-700">{{ sample.storage }}</span>
                    </TableCell>

                    <!-- Recorded By -->
                    <TableCell class="py-1 px-2 text-center">
                      <span class="font-bold text-slate-500 text-xs">{{ sample.recordedBy }}</span>
                    </TableCell>

                    <TableCell class="py-1 px-2 text-center">
                      <div class="flex items-center justify-center gap-1">
                        <!-- Save (Check) / Edit (Pencil) -->
                        <Button
                          size="icon"
                          variant="ghost"
                          class="h-7 w-7"
                          @click="toggleEdit(sample)"
                        >
                          <component
                            :is="editingSampleId === sample.id ? Check : Pencil"
                            class="w-3.5 h-3.5"
                            :class="
                              editingSampleId === sample.id ? 'text-green-600' : 'text-slate-400'
                            "
                          />
                        </Button>

                        <!-- Cancel (X) - Only when editing -->
                        <Button
                          v-if="editingSampleId === sample.id"
                          size="icon"
                          variant="ghost"
                          class="h-7 w-7 text-red-500 hover:text-red-600"
                          @click="cancelEdit(sample)"
                        >
                          <X class="w-3.5 h-3.5" />
                        </Button>

                        <!-- Delete (Trash) - Only when NOT editing -->
                        <Button
                          v-if="editingSampleId !== sample.id"
                          size="icon"
                          variant="ghost"
                          class="h-7 w-7 text-red-500 hover:text-red-600"
                          @click="handleDeleteSample(sample.id)"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  <!-- New Samples Rows -->
                  <TableRow
                    v-for="(sample, index) in newSamples"
                    :key="sample.id"
                    :data-row-id="sample.id"
                    class="bg-blue-50/20 dark:bg-blue-900/5"
                  >
                    <TableCell class="text-center font-bold text-xs text-blue-400">New</TableCell>

                    <!-- Total Weight -->
                    <TableCell class="py-1 px-2 text-center">
                      <Input
                        :model-value="sample.totalWeight"
                        class="h-8 w-24 text-center font-bold text-xs mx-auto"
                        @input="
                          handleNumericInput(
                            sample,
                            'totalWeight',
                            ($event.target as HTMLInputElement).value
                          )
                        "
                        @keydown.enter="focusNextInput"
                      />
                    </TableCell>

                    <!-- Pallet Weight -->
                    <TableCell class="py-1 px-2 text-center">
                      <Input
                        :model-value="sample.palletWeight"
                        class="h-8 w-24 text-center font-bold text-xs mx-auto"
                        @input="
                          handleNumericInput(
                            sample,
                            'palletWeight',
                            ($event.target as HTMLInputElement).value
                          )
                        "
                        @keydown.enter="focusNextInput"
                      />
                    </TableCell>

                    <!-- Gross Weight -->
                    <TableCell class="py-1 px-2 text-center">
                      <span class="font-bold text-blue-600">{{
                        formatNumber(sample.grossWeight)
                      }}</span>
                    </TableCell>

                    <!-- SPGR -->
                    <TableCell class="py-1 px-2 text-center">
                      <Input
                        v-model="sample.spgr"
                        class="h-8 w-24 text-center font-bold text-xs mx-auto"
                        @input="handleNumericInput(sample, 'spgr', $event.target.value)"
                        @keydown.enter="focusNextInput"
                      />
                    </TableCell>

                    <!-- Storage -->
                    <TableCell class="py-1 px-2 text-center">
                      <Input
                        v-model="sample.storage"
                        class="h-8 w-48 text-center font-bold text-xs mx-auto"
                        @keydown.enter="handleEnterOnLastFieldLogic"
                      />
                    </TableCell>

                    <!-- Recorded By -->
                    <TableCell class="py-1 px-2 text-center">
                      <span class="font-bold text-blue-400 text-xs">{{ sample.recordedBy }}</span>
                    </TableCell>

                    <TableCell class="py-1 px-2 text-center">
                      <div class="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          class="h-7 w-7 text-green-600 hover:text-green-700"
                          @click="handleSaveAllSamples"
                        >
                          <Save class="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          class="h-7 w-7 text-red-400 hover:text-red-500"
                          @click="removeNewSampleRow(index)"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  <!-- Totals Row -->
                  <TableRow class="bg-slate-100/50 dark:bg-slate-800/50 font-black border-t-2">
                    <TableCell class="text-center text-[0.625rem] uppercase">Totals</TableCell>
                    <TableCell class="py-1 px-2 text-center">{{
                      samples
                        .reduce((sum, s) => sum + parseRaw(s.totalWeight || 0), 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                    }}</TableCell>
                    <TableCell class="py-1 px-2 text-center">{{
                      samples
                        .reduce((sum, s) => sum + parseRaw(s.palletWeight || 0), 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                    }}</TableCell>
                    <TableCell class="text-center text-blue-600">{{
                      samples
                        .reduce((sum, s) => sum + parseRaw(s.grossWeight || 0), 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                    }}</TableCell>
                    <TableCell class="text-center"></TableCell>
                    <TableCell class="text-center"></TableCell>
                    <TableCell class="text-center"></TableCell>
                    <TableCell class="text-center"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div class="flex justify-end pt-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-8 text-xs gap-1.5 px-4"
                @click="router.back()"
              >
                <ArrowLeft class="w-3.5 h-3.5" />
                {{ t('common.back') }}
              </Button>
              <Button
                v-if="populatedCount > 0"
                size="sm"
                class="bg-green-600 hover:bg-green-700 h-8 text-xs gap-1.5 shadow-sm px-4"
                :disabled="isSaving"
                @click="handleSaveAllSamples"
              >
                <Save class="w-3.5 h-3.5" />
                {{ t('common.save') }} ({{ populatedCount }})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <AlertDialog :open="showSaveConfirm" @update:open="showSaveConfirm = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 text-yellow-500" />
            {{ t('common.confirm') }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('uss.confirmSaveAll', { count: populatedCount }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showSaveConfirm = false">{{
            t('common.cancel')
          }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmSaveSamples">{{
            t('common.confirm')
          }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2">
            <Trash2 class="h-5 w-5 text-destructive" />
            {{ t('uss.confirmDelete') }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t('uss.confirmDeleteMsg') ||
              'This action cannot be undone. This sample row will be permanently deleted.'
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showDeleteConfirm = false">{{
            t('common.cancel')
          }}</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive hover:bg-destructive/90"
            :disabled="isDeleting"
            @click="confirmDeleteSample"
          >
            {{ isDeleting ? t('common.deleting') : t('common.confirm') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
