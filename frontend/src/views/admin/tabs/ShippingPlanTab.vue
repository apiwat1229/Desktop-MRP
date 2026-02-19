<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  shippingPlansApi,
  type AvailablePallet,
  type ShippingPlan,
} from '@/services/shippingPlans';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Loader2,
  Package,
  Plus,
  Printer,
  Search,
  Truck,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import LoadingPlanModal from '../components/shipping/LoadingPlanModal.vue';
import PalletSelectionDrawer from '../components/shipping/PalletSelectionDrawer.vue';

const {} = useI18n();
const isLoading = ref(false);
const availablePallets = ref<AvailablePallet[]>([]);
const selectedPalletIds = ref<Set<string>>(new Set());
const searchQuery = ref('');

const newPlan = ref({
  planNo: '',
  customer: '',
  contractNo: '',
  planDate: new Date().toISOString().split('T')[0],
  remark: '',
});

const showLoadingPlan = ref(false);
const isDrawerOpen = ref(false);
const activeLot = ref<string | null>(null);

const fetchAvailablePallets = async () => {
  isLoading.value = true;
  try {
    availablePallets.value = await shippingPlansApi.getAvailablePallets();
  } catch (error) {
    console.error('Failed to fetch pallets:', error);
    toast.error('Failed to load passed pallets');
  } finally {
    isLoading.value = false;
  }
};

const filteredPallets = computed(() => {
  if (!searchQuery.value) return availablePallets.value;
  const q = searchQuery.value.toLowerCase();
  return availablePallets.value.filter(
    (p) => p.lotNo.toLowerCase().includes(q) || p.palletType.toLowerCase().includes(q)
  );
});

const groupedLots = computed(() => {
  const result: Record<
    string,
    { pallets: AvailablePallet[]; selectedCount: number; totalWeight: number }
  > = {};

  filteredPallets.value.forEach((p) => {
    if (!result[p.lotNo]) {
      result[p.lotNo] = { pallets: [], selectedCount: 0, totalWeight: 0 };
    }
    result[p.lotNo].pallets.push(p);
    if (isPalletSelected(p)) {
      result[p.lotNo].selectedCount++;
      result[p.lotNo].totalWeight += p.weight;
    }
  });

  return Object.entries(result)
    .map(([lotNo, data]) => ({
      lotNo,
      ...data,
    }))
    .sort((a, b) => b.lotNo.localeCompare(a.lotNo));
});

const togglePalletSelection = (pallet: AvailablePallet) => {
  const key = `${pallet.rowId}-${pallet.palletNo}`;
  if (selectedPalletIds.value.has(key)) {
    selectedPalletIds.value.delete(key);
  } else {
    selectedPalletIds.value.add(key);
  }
};

const isPalletSelected = (pallet: AvailablePallet) => {
  return selectedPalletIds.value.has(`${pallet.rowId}-${pallet.palletNo}`);
};

const selectedPalletsList = computed(() => {
  return availablePallets.value.filter((p) => isPalletSelected(p));
});

const isLotFullySelected = (pallets: AvailablePallet[]) => {
  return pallets.every((p) => isPalletSelected(p));
};

const toggleLotSelection = (pallets: AvailablePallet[]) => {
  const fullySelected = isLotFullySelected(pallets);
  pallets.forEach((p) => {
    const key = `${p.rowId}-${p.palletNo}`;
    if (fullySelected) {
      selectedPalletIds.value.delete(key);
    } else {
      selectedPalletIds.value.add(key);
    }
  });
};

const totalWeight = computed(() => {
  return selectedPalletsList.value.reduce((sum, p) => sum + p.weight, 0);
});

const totalWeightTons = computed(() => {
  return (totalWeight.value / 1000).toFixed(2);
});

const openLotDetails = (lotNo: string) => {
  activeLot.value = lotNo;
  isDrawerOpen.value = true;
};

const clRatio = computed(() => {
  const selected = selectedPalletsList.value;
  if (!selected.length) return 0;
  const clCount = selected.filter((p) => !p.palletType.toLowerCase().includes('uss')).length;
  return Math.round((clCount / selected.length) * 100);
});

const ussRatio = computed(() => {
  const selected = selectedPalletsList.value;
  if (!selected.length) return 0;
  const ussCount = selected.filter((p) => p.palletType.toLowerCase().includes('uss')).length;
  return Math.round((ussCount / selected.length) * 100);
});

const commonPalletType = computed(() => {
  const selected = selectedPalletsList.value;
  if (!selected.length) return '';
  // Get most common pallet type
  const counts: Record<string, number> = {};
  selected.forEach((p) => {
    counts[p.palletType] = (counts[p.palletType] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
});

const commonProductCode = computed(() => {
  const selected = selectedPalletsList.value;
  if (!selected.length) return '';
  // Product code usually derived from lot number (first 2-5 chars) or grade
  const firstLot = selected[0].lotNo;
  // Based on your image examples: grade 51 might be P0251, etc.
  // But let's just use the pallet type as product code if it looks like one, or a placeholder
  return firstLot.substring(0, 2) === '10' ? 'G0210' : 'G0251'; // Example logic
});

const activeLotPallets = computed(() => {
  if (!activeLot.value) return [];
  const lot = groupedLots.value.find((l) => l.lotNo === activeLot.value);
  return lot ? lot.pallets : [];
});

const handleSavePlan = async () => {
  if (!newPlan.value.planNo) {
    toast.error('Plan Number is required');
    return;
  }
  if (selectedPalletIds.value.size === 0) {
    toast.error('Please select at least one pallet');
    return;
  }

  isLoading.value = true;
  try {
    const planData: ShippingPlan = {
      ...newPlan.value,
      items: selectedPalletsList.value.map((p) => ({
        rowId: p.rowId,
        palletNo: p.palletNo,
      })),
    };
    await shippingPlansApi.create(planData);
    toast.success('FG LOADING PLAN created successfully');

    // Reset form
    newPlan.value = {
      planNo: '',
      customer: '',
      contractNo: '',
      planDate: new Date().toISOString().split('T')[0],
      remark: '',
    };
    selectedPalletIds.value.clear();
    await fetchAvailablePallets();
  } catch (error) {
    console.error('Failed to save plan:', error);
    toast.error('Failed to save loading plan');
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchAvailablePallets);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Truck class="w-8 h-8 text-primary" />
          FG LOADING PLAN
        </h2>
        <p class="text-slate-500 font-medium text-sm mt-1">
          Prepare loading plans from passed laboratory pallets
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          @click="fetchAvailablePallets"
          :disabled="isLoading"
          class="rounded-xl font-bold h-11 px-6 border-slate-200 bg-white"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin mr-2" />
          Refresh Pallets
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left: Lots Overview Table -->
      <div class="lg:col-span-8 space-y-4">
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            v-model="searchQuery"
            placeholder="Search by Lot No. or Pallet Type..."
            class="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-sm text-base font-medium focus:ring-primary/20"
          />
        </div>

        <div
          v-if="isLoading && availablePallets.length === 0"
          class="flex flex-col items-center justify-center py-20 text-slate-400"
        >
          <Loader2 class="w-12 h-12 animate-spin mb-4 text-primary/30" />
          <p class="font-bold uppercase tracking-widest text-xs">Loading available pallets...</p>
        </div>

        <div
          v-else-if="groupedLots.length === 0"
          class="bg-white border-2 border-dashed rounded-3xl p-16 text-center space-y-4"
        >
          <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <Package class="w-10 h-10 text-slate-300" />
          </div>
          <div>
            <h3 class="font-black text-slate-900 text-lg">No Pallets Available</h3>
            <p class="text-slate-500 text-sm">
              All passed pallets have been assigned or none exist.
            </p>
          </div>
        </div>

        <!-- Lots Table -->
        <div v-else class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader class="bg-slate-50/50">
              <TableRow class="hover:bg-transparent border-slate-100">
                <TableHead
                  class="font-bold text-slate-400 uppercase text-[10px] tracking-widest pl-8"
                  >Lot Number</TableHead
                >
                <TableHead
                  class="font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center"
                  >Pallets</TableHead
                >
                <TableHead
                  class="font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center"
                  >Status</TableHead
                >
                <TableHead
                  class="font-bold text-slate-400 uppercase text-[10px] tracking-widest text-right pr-8"
                  >Actions</TableHead
                >
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="lot in groupedLots"
                :key="lot.lotNo"
                @click="openLotDetails(lot.lotNo)"
                class="cursor-pointer group hover:bg-slate-50/80 transition-all border-slate-50"
              >
                <TableCell class="py-5 pl-8">
                  <div class="flex items-center gap-4 text-left">
                    <div
                      class="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"
                    >
                      <Package class="w-5 h-5" />
                    </div>
                    <div class="flex flex-col items-start">
                      <h4 class="font-black text-slate-900 text-lg uppercase leading-none">
                        {{ lot.lotNo }}
                      </h4>
                      <p
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"
                      >
                        Grade: {{ lot.pallets[0]?.lotNo.substring(0, 2) || '--' }}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell class="text-center">
                  <div class="flex flex-col items-center">
                    <span class="font-black text-slate-900 leading-none">{{
                      lot.pallets.length
                    }}</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"
                      >Units</span
                    >
                  </div>
                </TableCell>
                <TableCell class="text-center">
                  <div
                    class="inline-flex items-center px-3 py-1 rounded-full bg-slate-100/50 gap-2"
                  >
                    <Badge
                      variant="secondary"
                      class="h-5 px-1.5 min-w-[20px] justify-center text-[10px]"
                      :class="
                        lot.selectedCount > 0
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-slate-200 text-slate-400'
                      "
                    >
                      {{ lot.selectedCount }}
                    </Badge>
                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-tight"
                      >Selected</span
                    >
                  </div>
                </TableCell>
                <TableCell class="text-right pr-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="rounded-xl group-hover:bg-primary group-hover:text-white transition-all px-4 font-bold h-9"
                  >
                    Manage
                    <ChevronRight class="w-4 h-4 ml-1" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <!-- Right: Plan Details & Action -->
      <div class="lg:col-span-4 sticky top-6">
        <Card class="rounded-3xl border shadow-xl overflow-hidden bg-white">
          <div class="p-6 pb-0 text-left">
            <h3 class="text-lg font-black text-slate-900 border-b pb-4 border-slate-100">
              Plan Details
            </h3>
          </div>
          <CardContent class="p-6 space-y-6">
            <div class="space-y-4">
              <div class="space-y-1.5 flex flex-col items-start">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Plan No.</label
                >
                <Input
                  v-model="newPlan.planNo"
                  placeholder="e.g. SHIP-2024-001"
                  class="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div class="space-y-1.5 flex flex-col items-start">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Customer / Destination</label
                >
                <Input
                  v-model="newPlan.customer"
                  placeholder="Enter customer name"
                  class="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div class="space-y-1.5 flex flex-col items-start">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Contract No.</label
                >
                <Input
                  v-model="newPlan.contractNo"
                  placeholder="e.g. YS14865"
                  class="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div class="space-y-1.5 flex flex-col items-start">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Plan Date</label
                >
                <div class="relative w-full">
                  <CalendarIcon
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  />
                  <Input
                    v-model="newPlan.planDate"
                    type="date"
                    class="h-12 pl-10 rounded-xl border-slate-200 bg-slate-50 font-bold w-full"
                  />
                </div>
              </div>

              <div class="space-y-1.5 flex flex-col items-start">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Remark</label
                >
                <Input
                  v-model="newPlan.remark"
                  placeholder="Optional notes"
                  class="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold"
                />
              </div>
            </div>

            <!-- Summary Area -->
            <div
              class="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-lg shadow-slate-200"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider text-[10px]"
                  >Selected Pallets</span
                >
                <span class="text-xl font-black">{{ selectedPalletIds.size }}</span>
              </div>
              <div class="flex items-center justify-between border-t border-slate-800 pt-3">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider text-[10px]"
                  >Total Weight</span
                >
                <span class="text-xl font-black text-primary"
                  >{{ totalWeight.toLocaleString() }}
                  <span class="text-[10px] text-slate-400 ml-1">KG</span></span
                >
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                @click="showLoadingPlan = true"
                :disabled="selectedPalletIds.size === 0"
                class="h-16 rounded-2xl border-2 border-slate-200 font-black text-slate-700 hover:bg-slate-50 flex flex-col items-center justify-center gap-0"
              >
                <Printer class="w-5 h-5 mb-0.5" />
                <span class="text-xs">Preview Plan</span>
              </Button>

              <Button
                @click="handleSavePlan"
                :disabled="isLoading || selectedPalletIds.size === 0"
                class="h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-0 group"
              >
                <template v-if="!isLoading">
                  <span class="text-sm font-black flex items-center gap-1">
                    <Plus class="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    Save Plan
                  </span>
                  <span
                    class="text-[9px] font-bold text-primary-foreground/60 uppercase tracking-widest"
                    >Database</span
                  >
                </template>
                <Loader2 v-else class="w-6 h-6 animate-spin" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Details Drill-down Drawer -->
    <PalletSelectionDrawer
      v-model:open="isDrawerOpen"
      :lot-no="activeLot || ''"
      :pallets="activeLotPallets"
      :selected-ids="selectedPalletIds"
      @toggle-selection="togglePalletSelection"
      @toggle-lot="toggleLotSelection"
    />

    <!-- Loading Plan Document Modal -->
    <LoadingPlanModal
      v-model:open="showLoadingPlan"
      :plan-date="newPlan.planDate"
      :plan-no="newPlan.planNo"
      :customer="newPlan.customer"
      :contract-no="newPlan.contractNo"
      :total-weight="parseFloat(totalWeightTons)"
      :pallet-type="commonPalletType"
      :product-code="commonProductCode"
      :cl-ratio="clRatio"
      :uss-ratio="ussRatio"
      :items="selectedPalletsList.map((p) => ({ lotNo: p.lotNo, palletNo: p.palletNo }))"
    />
  </div>
</template>
