<script setup lang="ts">
import { bookingsApi } from '@/services/bookings';
import { jobOrdersApi, type JobOrder } from '@/services/jobOrders';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { List } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

import { useNavigationStore } from '@/stores/navigation';

import JobOrderForm from './components/JobOrderForm.vue';
import CuplumpPoolManagement from './CuplumpPoolManagement.vue';
import ClLabTab from './tabs/ClLabTab.vue';
import ClPoPriTab from './tabs/ClPoPriTab.vue';
import ClSummaryTab from './tabs/ClSummaryTab.vue';
import JobOrderTab from './tabs/JobOrderTab.vue';
import RawMaterialPlanForm from './tabs/RawMaterialPlanForm.vue';
import RawMaterialPlanList from './tabs/RawMaterialPlanList.vue';
import UssPoPriTab from './tabs/UssPoPriTab.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const navigationStore = useNavigationStore();

const isLoading = ref(false);
const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);
const statusFilter = ref('ALL');
const currentStats = ref({ total: 0, complete: 0, incomplete: 0 });
const currentTab = ref('cl-po-pri');
const selectedJobOrder = ref<JobOrder | undefined>(undefined);
const selectedRawMaterialPlan = ref<any>(undefined);

const searchQuery = computed({
  get: () => navigationStore.searchQuery,
  set: (val) => (navigationStore.searchQuery = val),
});

const selectedDateObject = computed({
  get: () => navigationStore.date,
  set: (val) => (navigationStore.date = val),
});

const selectedDate = computed(() => {
  return selectedDateObject.value ? selectedDateObject.value.toString() : '';
});

// Date Persistence Logic
const getInitialDate = () => {
  const now = today(getLocalTimeZone());
  const storedDateStr = localStorage.getItem('qa_selected_date');
  const storedTodayStr = localStorage.getItem('qa_last_accessed_today');
  const currentTodayStr = now.toString();

  if (!storedTodayStr || storedTodayStr !== currentTodayStr) {
    localStorage.setItem('qa_last_accessed_today', currentTodayStr);
    localStorage.removeItem('qa_selected_date');
    return now;
  }

  if (storedDateStr) {
    try {
      const d = JSON.parse(storedDateStr);
      if (d.year === now.year && d.month === now.month && d.day === now.day) {
        return new CalendarDate(d.year, d.month, d.day);
      } else {
        localStorage.removeItem('qa_selected_date');
        return now;
      }
    } catch (e) {
      return now;
    }
  }

  return now;
};

// Watchers
watch(selectedDateObject, (newDate) => {
  if (newDate) {
    localStorage.setItem(
      'qa_selected_date',
      JSON.stringify({
        year: newDate.year,
        month: newDate.month,
        day: newDate.day,
      })
    );
  } else {
    localStorage.removeItem('qa_selected_date');
  }
});

watch(
  () => route.params.tab,
  (newTab) => {
    if (newTab && typeof newTab === 'string') {
      currentTab.value = newTab;
    } else {
      currentTab.value = 'cl-po-pri';
    }
  },
  { immediate: true }
);

watch(
  currentTab,
  (newTab) => {
    if (newTab !== 'raw-material-plan-create') {
      selectedRawMaterialPlan.value = undefined;
    }
    if (newTab !== 'job-order-create') {
      selectedJobOrder.value = undefined;
    }

    // Update Navbar Title to match current tab
    const titleKey = `qa.tabs.${newTab.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;
    navigationStore.setTitle(t(titleKey));
  },
  { immediate: true }
);

// Handlers
const handleStatsUpdate = (stats: { total: number; complete: number; incomplete: number }) => {
  currentStats.value = stats;
};

const handleJobOrderEdit = (order: JobOrder) => {
  selectedJobOrder.value = order;
  router.push({ name: 'QualityAssurance', params: { tab: 'job-order-create' } });
};

const handleRawMaterialPlanEdit = (plan: any) => {
  selectedRawMaterialPlan.value = plan;
  router.push({ name: 'QualityAssurance', params: { tab: 'raw-material-plan-create' } });
};

const handleJobOrderSave = async (formData: JobOrder) => {
  try {
    if (formData.id) {
      await jobOrdersApi.update(formData.id, formData);
      toast.success(t('qa.jobOrderForm.updateSuccess') || 'Job order updated successfully');
    } else {
      await jobOrdersApi.create(formData);
      toast.success(t('qa.jobOrderForm.createSuccess') || 'Job order created successfully');
    }
    router.push({ name: 'QualityAssurance', params: { tab: 'job-order-list' } });
    selectedJobOrder.value = undefined;
  } catch (error: any) {
    console.error('Failed to save job order:', error);
    toast.error(error.response?.data?.message || t('common.errorSave'));
  }
};

const handleJobOrderDelete = async (id: string) => {
  try {
    await jobOrdersApi.delete(id);
    toast.success(t('common.deleteSuccess') || 'Job order deleted successfully');
    router.push({ name: 'QualityAssurance', params: { tab: 'job-order-list' } });
    selectedJobOrder.value = undefined;
  } catch (error: any) {
    console.error('Failed to delete job order:', error);
    toast.error(error.response?.data?.message || t('common.errorDelete'));
  }
};

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [bookingsData, typesData] = await Promise.all([
      bookingsApi.getAll(),
      rubberTypesApi.getAll(),
    ]);
    bookings.value = bookingsData;
    rubberTypes.value = typesData;
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle Hooks
onUnmounted(() => {
  navigationStore.reset();
});

onMounted(() => {
  fetchData();
  navigationStore.showControls = true;
  navigationStore.date = getInitialDate();
});
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Tab Content -->
    <!-- Tab Content Area -->
    <div
      class="flex-1 h-full overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
    >
      <!-- DEBUG: Current Tab = {{ currentTab }} -->
      <div v-if="currentTab === 'cl-po-pri'" key="tab-cl-po-pri">
        <ClPoPriTab
          key="component-cl-po-pri"
          :search-query="searchQuery"
          :date="selectedDate"
          :status-filter="statusFilter"
          @update:stats="handleStatsUpdate"
        />
      </div>
      <div v-else-if="currentTab === 'cl-lab'" key="tab-cl-lab">
        <ClLabTab
          key="component-cl-lab"
          :search-query="searchQuery"
          :date="selectedDate"
          :status-filter="statusFilter"
          @update:stats="handleStatsUpdate"
        />
      </div>
      <div v-else-if="currentTab === 'cl-summary'">
        <ClSummaryTab
          :search-query="searchQuery"
          :date="selectedDate"
          :status-filter="statusFilter"
          @update:stats="handleStatsUpdate"
        />
      </div>
      <div v-else-if="currentTab === 'cuplump-pool'">
        <CuplumpPoolManagement />
      </div>
      <div v-else-if="currentTab === 'uss-po-pri'">
        <UssPoPriTab
          :search-query="searchQuery"
          :date="selectedDate"
          :status-filter="statusFilter"
          @update:stats="handleStatsUpdate"
        />
      </div>
      <div v-else-if="currentTab === 'uss-summary'">
        <div
          class="flex items-center justify-center h-64 border rounded-lg bg-muted/20 border-dashed"
        >
          <div class="text-center">
            <List class="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 class="text-lg font-medium text-foreground">{{ t('qa.tabs.ussSummary') }}</h3>
            <p class="text-muted-foreground mt-1">{{ t('qa.comingSoon') }}</p>
          </div>
        </div>
      </div>
      <div v-else-if="currentTab === 'job-order-list'" key="tab-job-order-list">
        <JobOrderTab
          key="component-job-order-list"
          :search-query="searchQuery"
          :date="selectedDate"
          @edit="handleJobOrderEdit"
        />
      </div>
      <div v-else-if="currentTab === 'job-order-create'" key="tab-job-order-create">
        <JobOrderForm
          :initial-data="selectedJobOrder"
          @save="handleJobOrderSave"
          @delete="handleJobOrderDelete"
          @cancel="
            router.push({ name: 'QualityAssurance', params: { tab: 'job-order-list' } });
            selectedJobOrder = undefined;
          "
        />
      </div>
      <div v-if="currentTab === 'raw-material-plan-list'" key="tab-raw-material-plan-list">
        <RawMaterialPlanList
          :search-query="searchQuery"
          :date="selectedDate"
          @edit="handleRawMaterialPlanEdit"
        />
      </div>
      <div v-else-if="currentTab === 'raw-material-plan-create'" key="tab-raw-material-plan-create">
        <RawMaterialPlanForm
          :initial-data="selectedRawMaterialPlan"
          @cancel="
            router.push({ name: 'QualityAssurance', params: { tab: 'raw-material-plan-list' } });
            selectedRawMaterialPlan = undefined;
          "
        />
      </div>
    </div>
  </div>
</template>
