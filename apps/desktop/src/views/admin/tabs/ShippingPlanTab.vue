<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  shippingPlansApi,
  type AvailablePallet,
  type ShippingPlan,
} from '@/services/shippingPlans';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Package,
  Plus,
  Search,
  Truck,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const isLoading = ref(false);
const availablePallets = ref<AvailablePallet[]>([]);
const selectedPalletIds = ref<Set<string>>(new Set());
const searchQuery = ref('');

const newPlan = ref({
  planNo: '',
  customer: '',
  planDate: new Date().toISOString().split('T')[0],
  remark: '',
});

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

const totalWeight = computed(() => {
  return selectedPalletsList.value.reduce((sum, p) => sum + p.weight, 0);
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
    toast.success('Shipping Plan created successfully');

    // Reset form
    newPlan.value = {
      planNo: '',
      customer: '',
      planDate: new Date().toISOString().split('T')[0],
      remark: '',
    };
    selectedPalletIds.value.clear();
    await fetchAvailablePallets();
  } catch (error) {
    console.error('Failed to save plan:', error);
    toast.error('Failed to save shipping plan');
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
          Shipping Plan
        </h2>
        <p class="text-slate-500 font-medium text-sm mt-1">
          Prepare shipping plans from passed laboratory pallets
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
      <!-- Left: Inventory of Passed Pallets -->
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
          v-else-if="filteredPallets.length === 0"
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

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="pallet in filteredPallets"
            :key="`${pallet.rowId}-${pallet.palletNo}`"
            @click="togglePalletSelection(pallet)"
            class="group cursor-pointer p-5 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden"
            :class="[
              isPalletSelected(pallet)
                ? 'bg-primary/5 border-primary shadow-md shadow-primary/10'
                : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm',
            ]"
          >
            <!-- Checkmark badge -->
            <div
              v-if="isPalletSelected(pallet)"
              class="absolute -top-1 -right-1 w-10 h-10 bg-primary rounded-bl-3xl flex items-center justify-center text-white p-1"
            >
              <CheckCircle2 class="w-5 h-5" />
            </div>

            <div class="space-y-4 relative z-10">
              <div class="flex items-center justify-between">
                <Badge
                  :variant="isPalletSelected(pallet) ? 'default' : 'secondary'"
                  class="font-black tracking-tighter uppercase text-[10px]"
                >
                  {{ pallet.lotNo }}
                </Badge>
                <span class="text-[10px] font-bold text-slate-400">{{ pallet.startTime }}</span>
              </div>

              <div>
                <h4 class="text-lg font-black text-slate-900">Pallet {{ pallet.palletNo }}</h4>
                <p class="text-xs font-bold text-slate-500">{{ pallet.palletType }}</p>
              </div>

              <div class="flex items-end justify-between border-t pt-3 border-slate-100">
                <div class="flex flex-col">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >Weight</span
                  >
                  <span class="text-xl font-black text-slate-900"
                    >{{ pallet.weight }} <span class="text-xs text-slate-500 ml-1">KG</span></span
                  >
                </div>
                <div
                  class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors"
                >
                  <ChevronRight class="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Plan Details & Action -->
      <div class="lg:col-span-4 sticky top-6">
        <Card class="rounded-3xl border shadow-xl overflow-hidden bg-white">
          <div class="p-6 pb-0">
            <h3 class="text-lg font-black text-slate-900 border-b pb-4 border-slate-100">
              Plan Details
            </h3>
          </div>
          <CardContent class="p-6 space-y-6">
            <div class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Plan No.</label
                >
                <Input
                  v-model="newPlan.planNo"
                  placeholder="e.g. SHIP-2024-001"
                  class="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Customer / Destination</label
                >
                <Input
                  v-model="newPlan.customer"
                  placeholder="Enter customer name"
                  class="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Plan Date</label
                >
                <div class="relative">
                  <CalendarIcon
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  />
                  <Input
                    v-model="newPlan.planDate"
                    type="date"
                    class="h-12 pl-10 rounded-xl border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
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

            <Button
              @click="handleSavePlan"
              :disabled="isLoading || selectedPalletIds.size === 0"
              class="w-full h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-0 group"
            >
              <template v-if="!isLoading">
                <span class="text-lg font-black flex items-center gap-2">
                  <Plus class="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  Create Shipping Plan
                </span>
                <span
                  class="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest"
                  >Confirm & Save to database</span
                >
              </template>
              <Loader2 v-else class="w-6 h-6 animate-spin" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
