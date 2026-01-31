<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/navigation';
import { getLocalTimeZone, today } from '@internationalized/date';
import { Cuboid, Layers, Weight } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import Cuplump from './Cuplump.vue';
import Uss from './Uss.vue';

const navigationStore = useNavigationStore();

const route = useRoute();
const { t } = useI18n();

// Filter State
const searchQuery = computed({
  get: () => navigationStore.searchQuery,
  set: (val) => (navigationStore.searchQuery = val),
});
const activeStatus = ref('all'); // all, complete, incomplete

const selectedDateObject = computed({
  get: () => navigationStore.date,
  set: (val) => (navigationStore.date = val),
});

const selectedDate = computed(() => {
  return selectedDateObject.value ? selectedDateObject.value.toString() : '';
});

// Stats State
const stats = ref({
  total: 0,
  complete: 0,
  incomplete: 0,
  grossWeight: 0,
  netWeight: 0,
});

const handleStatsUpdate = (newStats: any) => {
  stats.value = newStats;
};

const activeTab = computed(() => {
  if (route.path.includes('uss')) return 'uss';
  return 'cuplump';
});

const headerIcon = computed(() => {
  return activeTab.value === 'uss' ? Layers : Cuboid;
});

const headerTitle = computed(() => {
  return activeTab.value === 'uss' ? t('uss.pageTitle') : t('cuplump.pageTitle');
});

onMounted(() => {
  navigationStore.showControls = true;
  if (!navigationStore.date) {
    navigationStore.date = today(getLocalTimeZone());
  }
});

onUnmounted(() => {
  navigationStore.reset();
});

watch(
  headerTitle,
  (newTitle) => {
    navigationStore.setTitle(newTitle);
  },
  { immediate: true }
);
</script>

<template>
  <div class="h-full flex flex-col space-y-6 w-full">
    <!-- Banner -->
    <div
      class="rounded-xl border bg-white shadow-sm p-4 px-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div class="absolute top-1/2 right-0 -translate-y-1/2 pointer-events-none opacity-[0.03]">
        <component :is="headerIcon" class="w-64 h-64 rotate-12" />
      </div>

      <div class="flex flex-col xl:flex-row gap-4 items-center justify-start w-full relative z-10">
        <!-- Status Tabs (Custom buttons consistent with design) -->
        <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
          <button
            v-for="status in ['all', 'complete', 'incomplete']"
            :key="status"
            @click="activeStatus = status"
            :class="
              cn(
                'px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-2 capitalize',
                activeStatus === status ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
              )
            "
          >
            {{ t(`common.${status}`) || status }}
            <Badge
              v-if="status === 'all'"
              variant="outline"
              class="h-5 px-1.5 min-w-[1.25rem] flex items-center justify-center text-[10px] font-black border-gray-200"
            >
              {{ stats.total }}
            </Badge>
            <Badge
              v-if="status === 'complete'"
              variant="outline"
              class="h-5 px-1.5 min-w-[1.25rem] flex items-center justify-center text-[10px] font-black border-green-200 text-green-600 bg-green-50"
            >
              {{ stats.complete }}
            </Badge>
            <Badge
              v-if="status === 'incomplete'"
              variant="outline"
              class="h-5 px-1.5 min-w-[1.25rem] flex items-center justify-center text-[10px] font-black border-orange-200 text-orange-600 bg-orange-50"
            >
              {{ stats.incomplete }}
            </Badge>
          </button>
        </div>

        <div
          class="flex flex-row gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 ml-auto leading-tight"
        >
          <!-- Gross Weight Stat -->
          <div
            class="rounded-lg border bg-orange-50/50 border-orange-100 px-3 py-1.5 flex flex-col justify-center min-w-[110px] shrink-0"
          >
            <div class="flex items-center gap-1.5 mb-0.5">
              <Weight class="w-3 h-3 text-orange-600" />
              <span class="text-[0.6rem] text-orange-600 font-bold uppercase tracking-wider">{{
                t('cuplump.grossWeight') || 'Gross Weight'
              }}</span>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-lg font-black text-orange-950 leading-none">{{
                stats.grossWeight.toLocaleString()
              }}</span>
              <span class="text-[0.6rem] font-bold text-orange-600/70">kg</span>
            </div>
          </div>

          <!-- Net Weight Stat -->
          <div
            class="rounded-lg border bg-green-50/50 border-green-100 px-3 py-1.5 flex flex-col justify-center min-w-[110px] shrink-0"
          >
            <div class="flex items-center gap-1.5 mb-0.5">
              <Weight class="w-3 h-3 text-green-600" />
              <span class="text-[0.6rem] text-green-600 font-bold uppercase tracking-wider">{{
                t('cuplump.netWeight') || 'Net Weight'
              }}</span>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-lg font-black text-green-950 leading-none">{{
                stats.netWeight.toLocaleString()
              }}</span>
              <span class="text-[0.6rem] font-bold text-green-600/70">kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1">
      <Cuplump
        v-if="activeTab === 'cuplump'"
        :embedded="true"
        :search-query="searchQuery"
        :selected-date="selectedDate"
        :active-status="activeStatus"
        @update:stats="handleStatsUpdate"
      />
      <Uss
        v-if="activeTab === 'uss'"
        :embedded="true"
        :search-query="searchQuery"
        :selected-date="selectedDate"
        :active-status="activeStatus"
        @update:stats="handleStatsUpdate"
      />
    </div>
  </div>
</template>
