<script setup lang="ts">
import { Calendar as CalendarIcon } from 'lucide-vue-next';

defineProps<{
  activeTab: string;
  searchQuery?: string;
  date?: string | any | null;
  isEditing?: boolean;
}>();

defineEmits(['update:category', 'update:activeTab', 'update:searchQuery', 'update:date']);
</script>

<template>
  <div
    class="rounded-xl border border-border bg-white shadow-sm p-3 px-5 flex flex-col md:flex-row items-center justify-between gap-4 w-full"
  >
    <!-- Actions Section (Left) -->
    <div class="flex items-center gap-2 w-full md:w-auto justify-start order-1">
      <!-- Extra content (like sub-tabs or buttons) -->
      <slot name="extra" />
    </div>

    <!-- Stats Section (Middle - Hidden/Spacer) -->
    <div class="hidden md:block flex-1 order-2"></div>

    <!-- Title Section (Right) -->
    <div class="flex items-center gap-3 w-full md:w-auto justify-end order-3">
      <h1 class="text-lg font-bold tracking-tight text-foreground text-right italic">
        <slot name="title">Quality Assurance</slot>
      </h1>
      <div class="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        <slot name="icon">
          <!-- Default Icon if not provided -->
          <CalendarIcon class="h-5 w-5" />
        </slot>
      </div>
    </div>
  </div>
</template>
