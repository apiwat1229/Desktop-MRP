<script setup lang="ts">
import PrinterUsageAnalytics from '@/components/helpdesk/PrinterUsageAnalytics.vue';
import { useAuthStore } from '@/stores/auth';
import { Monitor } from 'lucide-vue-next';
import type { DateRange } from 'reka-ui';
import { computed, inject, type Ref } from 'vue';

const authStore = useAuthStore();
const dateRange = inject<Ref<DateRange>>('helpDeskDateRange');

const isITDepartment = computed(() => {
  const userDept = authStore.user?.department;
  return userDept === 'Information Technology' || userDept === 'เทคโนโลยีสารสนเทศ (IT)';
});
</script>

<template>
  <div v-if="isITDepartment" class="h-full">
    <PrinterUsageAnalytics :date-range="dateRange" />
  </div>
  <div
    v-else
    class="flex flex-col items-center justify-center p-12 text-center text-muted-foreground"
  >
    <div class="mb-4 p-4 bg-muted/50 rounded-full">
      <Monitor class="w-12 h-12 opacity-50" />
    </div>
    <h3 class="text-xl font-bold text-foreground">Access Restricted</h3>
    <p>This section is restricted to IT Department personnel only.</p>
  </div>
</template>
