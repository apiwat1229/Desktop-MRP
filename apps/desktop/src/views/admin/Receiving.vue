<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getLocalTimeZone, today } from '@internationalized/date';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Cuboid, Layers, Search, Weight } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import Cuplump from './Cuplump.vue';
import Uss from './Uss.vue';

const route = useRoute();
const { t } = useI18n();

// Filter State
const searchQuery = ref('');
const activeStatus = ref('all'); // all, complete, incomplete
const selectedDateObject = ref<any>(today(getLocalTimeZone()));
const isDatePopoverOpen = ref(false);

const selectedDate = computed(() => {
  return selectedDateObject.value ? selectedDateObject.value.toString() : '';
});

const handleDateSelect = (newDate: any) => {
  selectedDateObject.value = newDate;
  isDatePopoverOpen.value = false;
};

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

const headerTitle = computed(() => {
  return activeTab.value === 'uss' ? t('uss.pageTitle') : t('cuplump.pageTitle');
});

const headerIcon = computed(() => {
  return activeTab.value === 'uss' ? Layers : Cuboid;
});
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

      <div class="flex items-center gap-4 relative z-10">
        <div
          class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary"
        >
          <component :is="headerIcon" class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-900">{{ headerTitle }}</h1>
        </div>
      </div>

      <div
        class="flex flex-col xl:flex-row gap-4 items-end justify-between w-full xl:w-auto xl:ml-auto mt-4 md:mt-0 relative z-10"
      >
        <!-- Search -->
        <div class="flex items-center shrink-0">
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                size="icon"
                class="h-9 w-9 bg-white/50 backdrop-blur-sm shadow-none border-border"
              >
                <Search class="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-80 p-2" align="end">
              <div class="relative w-full">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  :placeholder="t('common.search')"
                  class="pl-9 h-9"
                  auto-focus
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <!-- Date Picker -->
        <div class="grid gap-1.5 w-full md:w-auto">
          <Popover v-model:open="isDatePopoverOpen">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="
                  cn(
                    'w-full md:w-[160px] justify-start text-left font-bold h-9 bg-white/50 backdrop-blur-sm shadow-none',
                    !selectedDate && 'text-muted-foreground'
                  )
                "
              >
                <CalendarIcon class="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{{
                  selectedDate
                    ? format(new Date(selectedDate), 'dd-MMM-yyyy')
                    : t('common.selectDate')
                }}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar
                :model-value="selectedDateObject"
                @update:model-value="handleDateSelect"
                mode="single"
                initial-focus
              />
            </PopoverContent>
          </Popover>
        </div>

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

        <div class="flex flex-row gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
          <div
            class="rounded-lg border bg-green-50/50 border-green-100 px-3 py-1.5 flex flex-col justify-center min-w-[110px] shrink-0"
          >
            <div class="flex items-center gap-1.5 mb-0.5">
              <Weight class="w-3 h-3 text-green-600" />
              <span class="text-[0.6rem] text-green-600 font-bold uppercase tracking-wider">{{
                t('truckScale.stats.inOut') || 'Weight In / Out'
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
