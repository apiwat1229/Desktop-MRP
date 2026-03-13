<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { type ProductionReport } from '@/services/productionReports';
import { LayoutGrid, RefreshCw } from 'lucide-vue-next';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import JudgmentForm from '../components/production/JudgmentForm.vue';
import ProductionReportList from '../components/production/ProductionReportList.vue';

const { t } = useI18n();

const props = defineProps<{
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}>();

const emit = defineEmits(['update:stats']);

const activeView = ref<'list' | 'edit'>('list');
const selectedReport = ref<ProductionReport | undefined>(undefined);
const listKey = ref(0);

const handleEditReport = (report: ProductionReport) => {
  selectedReport.value = report;
  activeView.value = 'edit';
};

const handleReportSaved = () => {
  activeView.value = 'list';
  listKey.value++;
};

const handleReportCancel = () => {
  activeView.value = 'list';
};

const handleRefresh = () => {
  listKey.value++;
};
</script>

<template>
  <div class="space-y-6">
    <!-- Premium Header -->
    <div
      v-if="activeView === 'list'"
      class="rounded-xl border bg-white shadow-sm p-4 px-6 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6"
    >
      <!-- Decorative Background Icon -->
      <LayoutGrid
        class="absolute -right-8 -bottom-8 w-64 h-64 text-slate-100/50 -rotate-12 pointer-events-none"
      />

      <!-- Title / Stats placeholder -->
      <div class="flex items-center justify-start gap-12 relative z-10 flex-1">
        <div class="text-left">
          <h2 class="text-lg font-black text-slate-900 leading-tight">
            {{ t('qa.tabs.judgment') }}
          </h2>
          <p class="text-xs text-muted-foreground font-medium">
            {{ t('production.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Action Button (Right Side) -->
      <div class="flex items-center gap-3 relative z-10 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          @click="handleRefresh"
          class="h-10 gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-all rounded-xl"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': false }" />
          Refresh
        </Button>
      </div>
    </div>

    <div v-if="activeView === 'list'">
      <ProductionReportList
        :key="listKey"
        :search-query="searchQuery"
        :start-date="startDate"
        :end-date="endDate"
        @edit="handleEditReport"
      />
    </div>

    <div v-else-if="activeView === 'edit'">
      <JudgmentForm
        :initial-data="selectedReport"
        @saved="handleReportSaved"
        @cancel="handleReportCancel"
      />
    </div>
  </div>
</template>
