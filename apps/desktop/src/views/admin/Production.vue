<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { usePermissions } from '@/composables/usePermissions';
import { type JobOrder, jobOrdersApi } from '@/services/jobOrders';
import { type ProductionReport, productionReportsApi } from '@/services/productionReports';
import { useNavigationStore } from '@/stores/navigation';
import { getLocalTimeZone, today } from '@internationalized/date';
import { Layers, LayoutGrid, Plus, Shield } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';
import JobOrderDetails from './components/JobOrderDetails.vue';
import JobOrderForm from './components/JobOrderForm.vue';
import ProductionReportForm from './components/production/ProductionReportForm.vue';
import ProductionReportList from './components/production/ProductionReportList.vue';
import JobOrderTab from './tabs/JobOrderTab.vue';

const { t } = useI18n();
const { hasPermission, isAdmin } = usePermissions();

const canRead = computed(() => isAdmin.value || hasPermission('production:read'));
const canCreate = computed(() => isAdmin.value || hasPermission('production:create'));

const route = useRoute();

// Context: 'production' | 'job-order'
const activeContext = computed(() => {
  if (route.name === 'JobOrders' || route.path.includes('production/job-orders')) {
    return 'job-order';
  }
  if (route.name === 'QaJobOrders' || route.path.includes('qa/job-orders')) {
    return 'job-order';
  }
  return 'production';
});

const isQaContext = computed(
  () => route.name === 'QaJobOrders' || route.path.includes('qa/job-orders')
);
const isReadonly = computed(
  () => activeContext.value === 'job-order' && !isQaContext.value && !isAdmin.value
);
// View: 'list' | 'create' | 'details'
const activeTab = ref('list');

// Filters
const navigationStore = useNavigationStore();
const searchQuery = computed({
  get: () => navigationStore.searchQuery,
  set: (val) => (navigationStore.searchQuery = val),
});

const selectedDateRange = computed({
  get: () => navigationStore.dateRange,
  set: (val) => (navigationStore.dateRange = val),
});

const selectedDateRangeString = computed(() => {
  return {
    start: selectedDateRange.value.start ? selectedDateRange.value.start.toString() : '',
    end: selectedDateRange.value.end ? selectedDateRange.value.end.toString() : '',
  };
});

// Production Report State
const selectedReport = ref<ProductionReport | undefined>(undefined);

// Job Order State
const selectedJobOrder = ref<JobOrder | undefined>(undefined);
const jobOrderListKey = ref(0); // To force refresh list

// Production Handlers
const handleEditReport = (report: ProductionReport) => {
  selectedReport.value = report;
  activeTab.value = 'create';
};

const handleReportSaved = () => {
  activeTab.value = 'list';
};

const handleReportCancel = () => {
  activeTab.value = 'list';
};

// Job Order Handlers
const handleViewJobOrder = (jobOrder: JobOrder) => {
  selectedJobOrder.value = jobOrder;
  activeTab.value = 'details';
};

const handleEditJobOrder = (jobOrder: JobOrder) => {
  selectedJobOrder.value = jobOrder;
  activeTab.value = 'create';
};

const handleJobOrderSave = async (data: JobOrder) => {
  try {
    if (data.id) {
      await jobOrdersApi.update(data.id, data);
      toast.success(t('qa.jobOrderForm.updateSuccess'));
    } else {
      await jobOrdersApi.create(data);
      toast.success(t('qa.jobOrderForm.createSuccess'));
    }
    activeTab.value = 'list';
    jobOrderListKey.value++; // Refresh list
  } catch (error) {
    console.error('Failed to save job order', error);
    toast.error(t('common.errorSave'));
  }
};

const handleJobOrderDelete = async (id: string) => {
  try {
    await jobOrdersApi.delete(id);
    toast.success(t('common.deleteSuccess'));
    activeTab.value = 'list';
    jobOrderListKey.value++; // Refresh list
  } catch (error) {
    console.error('Failed to delete job order', error);
    toast.error(t('common.error'));
  }
};

const handleJobOrderCancel = () => {
  activeTab.value = 'list';
};

// Reset view when switching context
watch(activeContext, () => {
  activeTab.value = 'list';
  selectedReport.value = undefined;
  selectedJobOrder.value = undefined;
});

// Reset selection when switching to list tab manually
watch(activeTab, (newTab) => {
  if (newTab === 'list') {
    selectedReport.value = undefined;
    selectedJobOrder.value = undefined;
  }
});

const handleCreateClick = () => {
  selectedReport.value = undefined;
  selectedJobOrder.value = undefined;
  activeTab.value = 'create';
};

// Header Computed
const headerIcon = computed(() => (activeContext.value === 'production' ? LayoutGrid : Layers));
const headerTitle = computed(() =>
  activeContext.value === 'production' ? t('production.title') : t('production.jobOrderList')
);

// Stats State
const stats = ref({
  production: { reports: 0, pallets: 0, bales: 0 },
  jobOrder: { total: 0, active: 0, closed: 0 },
});

const fetchStats = async () => {
  try {
    if (activeContext.value === 'production') {
      let reports = await productionReportsApi.getAll();

      // Filter by date range
      if (selectedDateRangeString.value.start && selectedDateRangeString.value.end) {
        const startDateStr = selectedDateRangeString.value.start.split('T')[0];
        const endDateStr = selectedDateRangeString.value.end.split('T')[0];
        reports = reports.filter((r) => {
          const dateVal =
            r.productionDate instanceof Date ? r.productionDate.toISOString() : r.productionDate;
          const reportDate = dateVal?.split('T')[0];
          return reportDate && reportDate >= startDateStr && reportDate <= endDateStr;
        });
      }

      let totalPallets = 0;
      reports.forEach((r) => {
        r.rows?.forEach((row) => {
          if (Number(row.weight1) > 0) totalPallets++;
          if (Number(row.weight2) > 0) totalPallets++;
          if (Number(row.weight3) > 0) totalPallets++;
          if (Number(row.weight4) > 0) totalPallets++;
          if (Number(row.weight5) > 0) totalPallets++;
        });
      });
      stats.value.production = {
        reports: reports.length,
        pallets: totalPallets,
        bales: totalPallets * 35,
      };
    } else {
      let jobs = await jobOrdersApi.getAll();

      // Filter by date range
      if (selectedDateRangeString.value.start && selectedDateRangeString.value.end) {
        const startDateStr = selectedDateRangeString.value.start.split('T')[0];
        const endDateStr = selectedDateRangeString.value.end.split('T')[0];
        jobs = jobs.filter((j) => {
          const jobDate = j.qaDate?.split('T')[0];
          return jobDate && jobDate >= startDateStr && jobDate <= endDateStr;
        });
      }

      stats.value.jobOrder = {
        total: jobs.length,
        active: jobs.filter((j) => !j.isClosed).length,
        closed: jobs.filter((j) => j.isClosed).length,
      };
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};

onUnmounted(() => {
  navigationStore.reset();
});

onMounted(() => {
  fetchStats();
  navigationStore.showControls = true;
  if (!navigationStore.dateRange.start || !navigationStore.dateRange.end) {
    const now = today(getLocalTimeZone());
    navigationStore.dateRange = {
      start: now.subtract({ days: 30 }),
      end: now,
    };
  }
});
watch([activeContext, selectedDateRangeString], fetchStats);

// Sync Title
watch(
  headerTitle,
  (newTitle) => {
    navigationStore.setTitle(newTitle);
  },
  { immediate: true }
);

import { onUnmounted } from 'vue';
</script>

<template>
  <div v-if="canRead" class="flex flex-col space-y-4 p-2 w-full">
    <!-- Premium Header -->
    <div
      v-if="activeTab === 'list'"
      class="rounded-xl border bg-white shadow-sm p-4 px-6 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6"
    >
      <!-- Decorative Background Icon -->
      <div class="absolute top-1/2 right-0 -translate-y-1/2 pointer-events-none opacity-[0.03]">
        <component :is="headerIcon" class="w-64 h-64 rotate-12" />
      </div>

      <!-- Stats Section -->
      <div class="flex items-center justify-center lg:justify-start gap-12 relative z-10 flex-1">
        <template v-if="activeContext === 'production'">
          <div class="text-center group/stat">
            <span
              class="block text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest mb-1 group-hover/stat:text-primary transition-colors"
              >{{ t('production.stats.totalReports') }}</span
            >
            <span class="text-lg font-black text-slate-900 tabular-nums">{{
              stats.production.reports
            }}</span>
          </div>
          <div class="text-center group/stat">
            <span
              class="block text-[0.6rem] font-black text-emerald-500 uppercase tracking-widest mb-1 group-hover/stat:text-emerald-600 transition-colors"
              >{{ t('production.stats.totalPallets') }}</span
            >
            <span class="text-lg font-black text-emerald-600 tabular-nums">{{
              stats.production.pallets
            }}</span>
          </div>
          <div class="text-center group/stat">
            <span
              class="block text-[0.6rem] font-black text-orange-500 uppercase tracking-widest mb-1 group-hover/stat:text-orange-600 transition-colors"
              >{{ t('production.stats.totalBales') }}</span
            >
            <span class="text-lg font-black text-orange-600 tabular-nums">{{
              stats.production.bales
            }}</span>
          </div>
        </template>
        <template v-else>
          <div class="text-center group/stat">
            <span
              class="block text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest mb-1 group-hover/stat:text-primary transition-colors"
              >{{ t('production.stats.totalOrders') }}</span
            >
            <span class="text-lg font-black text-slate-900 tabular-nums">{{
              stats.jobOrder.total
            }}</span>
          </div>
          <div class="text-center group/stat">
            <span
              class="block text-[0.6rem] font-black text-blue-500 uppercase tracking-widest mb-1 group-hover/stat:text-blue-600 transition-colors"
              >{{ t('production.stats.activeJobs') }}</span
            >
            <span class="text-lg font-black text-blue-600 tabular-nums">{{
              stats.jobOrder.active
            }}</span>
          </div>
          <div class="text-center group/stat">
            <span
              class="block text-[0.6rem] font-black text-emerald-500 uppercase tracking-widest mb-1 group-hover/stat:text-emerald-600 transition-colors"
              >{{ t('production.stats.completed') }}</span
            >
            <span class="text-lg font-black text-emerald-600 tabular-nums">{{
              stats.jobOrder.closed
            }}</span>
          </div>
        </template>
      </div>

      <!-- Create Button (Right Side) -->
      <div class="flex items-center gap-3 relative z-10 ml-auto">
        <Button
          v-if="canCreate && (activeContext === 'production' || isQaContext)"
          @click="handleCreateClick"
          class="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-primary/20 shadow-lg px-6 h-10 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
        >
          <Plus class="w-4 h-4" />
          {{ activeContext === 'production' ? 'NEW REPORT' : 'NEW ORDER' }}
        </Button>
      </div>
    </div>

    <!-- Main Tabs -->
    <Tabs v-model="activeTab" class="h-full flex flex-col">
      <!-- Content -->
      <div class="flex-1 overflow-hidden">
        <!-- List Tab -->
        <TabsContent value="list" class="h-full mt-0 border-0 p-0">
          <template v-if="activeContext === 'production'">
            <ProductionReportList
              :search-query="searchQuery"
              :start-date="selectedDateRangeString.start"
              :end-date="selectedDateRangeString.end"
              @edit="handleEditReport"
            />
          </template>
          <template v-else>
            <JobOrderTab
              :key="jobOrderListKey"
              :search-query="searchQuery"
              :start-date="selectedDateRangeString.start"
              :end-date="selectedDateRangeString.end"
              :readonly="isReadonly"
              :hide-stats="true"
              @view="handleViewJobOrder"
              @edit="handleEditJobOrder"
            />
          </template>
        </TabsContent>

        <!-- Create/Form Tab -->
        <TabsContent value="create" class="h-full mt-0 border-0 p-0">
          <div class="h-full flex flex-col">
            <template v-if="activeContext === 'production'">
              <ProductionReportForm
                :initial-data="selectedReport"
                @saved="handleReportSaved"
                @cancel="handleReportCancel"
              />
            </template>
            <template v-else>
              <JobOrderForm
                :initial-data="selectedJobOrder || {}"
                @save="handleJobOrderSave"
                @delete="handleJobOrderDelete"
                @cancel="handleJobOrderCancel"
              />
            </template>
          </div>
        </TabsContent>

        <!-- Details Tab -->
        <TabsContent value="details" class="h-full mt-0 border-0 p-0">
          <div class="h-full flex flex-col">
            <JobOrderDetails
              v-if="selectedJobOrder"
              :job-order="selectedJobOrder"
              :readonly="isReadonly"
              @back="activeTab = 'list'"
              @updated="selectedJobOrder = $event"
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  </div>
  <div v-else class="h-full flex items-center justify-center">
    <div class="text-center">
      <Shield class="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
      <h3 class="text-lg font-medium text-muted-foreground">Access Denied</h3>
      <p class="text-sm text-muted-foreground/60">
        You don't have permission to access Production Reports.
      </p>
    </div>
  </div>
</template>
