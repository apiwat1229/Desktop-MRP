<script setup lang="ts">
import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
  parseDate,
} from '@internationalized/date';
import { Calendar as CalendarIcon, Search as SearchIcon } from 'lucide-vue-next';

import { computed, ref } from 'vue';
const props = defineProps<{
  activeTab: string;
  searchQuery?: string;
  date?: string | DateValue | null;
  isEditing?: boolean;
}>();

const emit = defineEmits([
  'update:category',
  'update:activeTab',
  'update:searchQuery',
  'update:date',
]);

const isCalendarOpen = ref(false);

// Date Handling
const df = new DateFormatter('en-GB', {
  dateStyle: 'medium',
});

const selectedDate = computed({
  get: () => {
    if (!props.date) return undefined;
    if (typeof props.date === 'string') {
      try {
        return parseDate(props.date);
      } catch {
        return undefined;
      }
    }
    return props.date;
  },
  set: (val) => emit('update:date', val),
});

const formattedDate = computed(() => {
  if (!selectedDate.value) return '-';
  return df.format(selectedDate.value.toDate(getLocalTimeZone()));
});

// Helper to determine if we should show global search/date controls
const showGlobalControls = computed(() => {
  const list = [
    'cl-po-pri',
    'cl-lab',
    'cl-summary',
    'uss-po-pri',
    'uss-summary',
    'cuplump-pool',
    'job-order-list',
    'job-order-create',
    'raw-material-plan-list',
  ];
  return list.includes(props.activeTab);
});

// ... existing code ...
</script>

<template>
  <div
    class="rounded-xl border border-border bg-white shadow-sm p-3 px-5 flex flex-col md:flex-row items-center justify-between gap-4 w-full"
  >
    <!-- Actions Section (Left) -->
    <div class="flex items-center gap-2 w-full md:w-auto justify-start order-1">
      <!-- Global Controls (Show only for standard tabs) -->
      <div v-if="showGlobalControls" class="flex items-center gap-2">
        <!-- Search Popover -->
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              class="h-9 w-9 text-muted-foreground hover:text-primary bg-white hover:bg-slate-50 shadow-sm border-slate-200"
            >
              <SearchIcon class="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-80 p-2" align="start">
            <div class="flex items-center gap-2">
              <SearchIcon class="h-4 w-4 text-muted-foreground" />
              <Input
                :model-value="searchQuery"
                @update:model-value="$emit('update:searchQuery', $event)"
                placeholder="Search items..."
                class="h-8 border-none focus-visible:ring-0 shadow-none"
                auto-focus
              />
            </div>
          </PopoverContent>
        </Popover>

        <!-- Date Popover -->
        <Popover v-model:open="isCalendarOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-9 w-[180px] justify-center text-foreground font-normal bg-white hover:bg-slate-50 shadow-sm transition-all border-slate-200"
            >
              <span class="text-xs font-medium">{{ formattedDate }}</span>
              <CalendarIcon class="ml-3 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar
              :model-value="selectedDate"
              @update:model-value="
                (date: any) => {
                  selectedDate = date;
                  isCalendarOpen = false;
                }
              "
              mode="single"
            />
          </PopoverContent>
        </Popover>
      </div>

      <!-- Extra content (like sub-tabs or buttons) -->
      <slot name="extra" />
    </div>

    <!-- Stats Section (Middle - Hidden/Spacer) -->
    <div class="hidden md:block flex-1 order-2"></div>

    <!-- Title Section (Right) -->
    <div class="flex items-center gap-3 w-full md:w-auto justify-end order-3">
      <div>
        <h1 class="text-lg font-bold tracking-tight text-foreground text-right">
          <slot name="title">Quality Assurance</slot>
        </h1>
        <p v-if="$slots.subtitle" class="text-xs text-muted-foreground text-right">
          <slot name="subtitle">Manage quality control and reports</slot>
        </p>
      </div>
      <div class="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        <slot name="icon">
          <!-- Default Icon if not provided -->
          <CalendarIcon class="h-5 w-5" />
        </slot>
      </div>
    </div>
  </div>
</template>
