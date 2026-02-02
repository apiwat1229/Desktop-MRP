<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import approvalsApi from '@/services/approvals';
import { bookingsApi } from '@/services/bookings';
import { notificationsApi } from '@/services/notifications';
import { useAuthStore } from '@/stores/auth';
import { getLocalTimeZone, today } from '@internationalized/date';
import {
  Activity,
  AlertCircle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  Plus,
  TrendingUp,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import VueApexCharts from 'vue3-apexcharts';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();
const appVersion = __APP_VERSION__;

// -- State --
const pendingApprovalsCount = ref(0);
const todayBookingsCount = ref(0);
const unreadNotifications = ref<any[]>([]);
const systemStatus = ref('ONLINE'); // Dummy status for now
const bookingTrendData = ref<number[]>([0, 0, 0, 0, 0, 0, 0]);

// -- Charts --
const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    fontFamily: 'inherit',
    toolbar: { show: false },
    animations: { enabled: true },
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 100],
    },
  },
  xaxis: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], // Placeholder
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#94a3b8' } },
  },
  yaxis: { show: false },
  grid: {
    show: true,
    borderColor: '#f1f5f9',
    strokeDashArray: 4,
    padding: { top: 0, right: 0, bottom: 0, left: 10 },
  },
  colors: ['#0ea5e9'], // Sky-500
  tooltip: {
    theme: 'light',
    y: { formatter: (val: number) => Math.round(val) },
  },
}));

const series = computed(() => [
  {
    name: 'Bookings',
    data: bookingTrendData.value,
  },
]);

// -- Actions --
const navigateTo = (path: string) => router.push(path);

const fetchData = async () => {
  try {
    // 1. Pending Approvals
    if (
      authStore.user?.role === 'ADMIN' ||
      authStore.user?.permissions?.includes('approvals:read')
    ) {
      const approvals = await approvalsApi.getAll({ status: 'PENDING' });
      pendingApprovalsCount.value = approvals.data?.length || 0;
    }

    // 2. Today's Bookings
    const todayDate = today(getLocalTimeZone()).toString();
    const bookings = await bookingsApi.getAll({ date: todayDate, status: 'VERIFIED' });
    todayBookingsCount.value = bookings.length;

    // 3. Unread Notifications
    const notifs = await notificationsApi.getUnread();
    unreadNotifications.value = notifs.data?.slice(0, 5) || [];

    // 4. Mock Trend Data (Random for visual demo if no API)
    // In real app, you'd fetch "last 7 days stats"
    bookingTrendData.value = [4, 6, 8, 5, 10, 12, 9];
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
};

onMounted(() => {
  fetchData();
});

const currentTime = ref(new Date());
setInterval(() => {
  currentTime.value = new Date();
}, 60000);

const greeting = computed(() => {
  const hour = currentTime.value.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
});
</script>

<template>
  <div class="h-full overflow-y-auto bg-slate-50/50 p-6 sm:p-8 space-y-8">
    <!-- 1. Welcome Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          {{ greeting }}, {{ authStore.user?.firstName || 'User' }}
          <span class="text-2xl">👋</span>
        </h1>
        <p class="text-slate-500 mt-1 font-medium">Here's what's happening in your system today.</p>
      </div>
      <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border">
        <Clock class="w-5 h-5 text-primary/70" />
        <div class="flex flex-col items-end">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {{
              currentTime.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })
            }}
          </span>
          <span class="text-sm font-black text-slate-700">
            {{ currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 2. Key Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Pending Approvals -->
      <Card
        class="border-0 shadow-sm ring-1 ring-slate-200 bg-white hover:ring-primary/20 transition-all cursor-pointer group"
        @click="navigateTo('/admin/approvals')"
      >
        <CardContent class="p-6 flex items-center justify-between">
          <div>
            <p class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pending Approvals
            </p>
            <h3
              class="text-4xl font-black text-slate-800 group-hover:text-primary transition-colors"
            >
              {{ pendingApprovalsCount }}
            </h3>
          </div>
          <div
            class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"
          >
            <AlertCircle class="w-7 h-7" />
          </div>
        </CardContent>
      </Card>

      <!-- Today's Bookings -->
      <Card
        class="border-0 shadow-sm ring-1 ring-slate-200 bg-white hover:ring-primary/20 transition-all cursor-pointer group"
        @click="navigateTo('/bookings/queue')"
      >
        <CardContent class="p-6 flex items-center justify-between">
          <div>
            <p class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Today's Bookings
            </p>
            <h3
              class="text-4xl font-black text-slate-800 group-hover:text-primary transition-colors"
            >
              {{ todayBookingsCount }}
            </h3>
          </div>
          <div
            class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"
          >
            <CalendarCheck class="w-7 h-7" />
          </div>
        </CardContent>
      </Card>

      <!-- System Status -->
      <Card class="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
        <CardContent class="p-6 flex items-center justify-between">
          <div>
            <p class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              System Status
            </p>
            <div class="flex items-center gap-2">
              <span class="relative flex h-3 w-3">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                ></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <h3 class="text-xl font-black text-green-600">
                {{ systemStatus }}
              </h3>
            </div>
            <p class="text-xs text-slate-400 mt-1">v{{ appVersion }}</p>
          </div>
          <div
            class="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-500"
          >
            <CheckCircle2 class="w-7 h-7" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 3. Main Content: Activity & Notifications -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Activity Trend -->
      <div class="lg:col-span-2 space-y-6">
        <Card class="border-0 shadow-sm ring-1 ring-slate-200">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-lg font-black text-slate-700 flex items-center gap-2">
              <TrendingUp class="w-5 h-5 text-primary" />
              Weekly Booking Activity
            </CardTitle>
          </CardHeader>
          <CardContent class="pl-2">
            <div class="h-[300px] w-full">
              <VueApexCharts type="area" height="100%" :options="chartOptions" :series="series" />
            </div>
          </CardContent>
        </Card>

        <!-- Quick Actions Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Button
            variant="outline"
            class="h-auto py-4 flex flex-col gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
            @click="navigateTo('/bookings/create')"
          >
            <div
              class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
            >
              <Plus class="w-5 h-5" />
            </div>
            <span class="font-bold text-xs text-slate-600">New Booking</span>
          </Button>

          <Button
            variant="outline"
            class="h-auto py-4 flex flex-col gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
            @click="navigateTo('/admin/production/new')"
          >
            <div
              class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"
            >
              <FileText class="w-5 h-5" />
            </div>
            <span class="font-bold text-xs text-slate-600">New Report</span>
          </Button>

          <Button
            variant="outline"
            class="h-auto py-4 flex flex-col gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
            @click="navigateTo('/admin/qa')"
          >
            <div
              class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"
            >
              <Activity class="w-5 h-5" />
            </div>
            <span class="font-bold text-xs text-slate-600">QA Check</span>
          </Button>

          <Button
            variant="outline"
            class="h-auto py-4 flex flex-col gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
            @click="navigateTo('/admin/settings')"
          >
            <div
              class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <Cpu class="w-5 h-5" />
            </div>
            <span class="font-bold text-xs text-slate-600">System Config</span>
          </Button>
        </div>
      </div>

      <!-- Right: Recent Alerts & System Health -->
      <div class="space-y-6">
        <Card class="border-0 shadow-sm ring-1 ring-slate-200 h-full">
          <CardHeader class="pb-2">
            <CardTitle class="text-lg font-black text-slate-700 flex items-center justify-between">
              <span class="flex items-center gap-2">
                <Bell class="w-5 h-5 text-orange-500" />
                Recent Alerts
              </span>
              <Button
                variant="ghost"
                size="sm"
                class="text-xs h-7"
                @click="navigateTo('/activity-center')"
                >View All</Button
              >
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <div
              v-if="unreadNotifications.length === 0"
              class="p-8 text-center text-slate-400 text-sm font-medium"
            >
              No new notifications
            </div>
            <div v-else class="divide-y divide-slate-100">
              <div
                v-for="notif in unreadNotifications"
                :key="notif.id"
                class="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                @click="navigateTo(notif.actionUrl || '/activity-center')"
              >
                <div class="flex gap-3">
                  <div class="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0"></div>
                  <div>
                    <p class="text-sm font-bold text-slate-700 leading-tight mb-1">
                      {{ notif.title }}
                    </p>
                    <p class="text-xs text-slate-500 line-clamp-2">{{ notif.message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Gradient Text utility if needed */
.text-gradient {
  @apply bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600;
}
</style>
