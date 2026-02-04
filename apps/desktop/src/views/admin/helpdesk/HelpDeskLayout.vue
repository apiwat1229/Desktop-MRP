<script setup lang="ts">
import { Button } from '@/components/ui/button';
import DateRangePicker from '@/components/ui/date-range-picker.vue';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getLocalTimeZone, today } from '@internationalized/date';
import { Search } from 'lucide-vue-next';
import type { DateRange } from 'reka-ui';
import { provide, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const searchQuery = ref('');
const dateRange = ref({
  start: today(getLocalTimeZone()).subtract({ months: 1 }),
  end: today(getLocalTimeZone()),
}) as Ref<DateRange>;

// Provide these to child components
provide('helpDeskSearchQuery', searchQuery);
provide('helpDeskDateRange', dateRange);
</script>

<template>
  <div class="flex flex-col h-full space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between space-y-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Help Desk</h2>
      </div>
      <div class="flex items-center gap-3">
        <!-- Search Popover -->
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              class="h-9 w-9 text-muted-foreground hover:text-primary bg-white/50 hover:bg-white shadow-sm border-slate-200"
            >
              <Search class="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-80 p-2" align="end">
            <div class="flex items-center gap-2">
              <Search class="h-4 w-4 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                :placeholder="t('services.itHelp.searchPlaceholder')"
                class="h-8 border-none focus-visible:ring-0 shadow-none"
                auto-focus
              />
            </div>
          </PopoverContent>
        </Popover>

        <!-- Date Picker -->
        <DateRangePicker
          v-model="dateRange"
          class="h-9 w-[280px] justify-center text-foreground font-normal bg-white/50 hover:bg-white shadow-sm transition-all border-slate-200 text-xs"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1">
      <router-view />
    </div>
  </div>
</template>
