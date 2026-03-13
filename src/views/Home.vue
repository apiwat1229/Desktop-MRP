<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import approvalsApi from '@/services/approvals';
import { bookingsApi } from '@/services/bookings';
import { notificationsApi } from '@/services/notifications';
import { useAuthStore } from '@/stores/auth';
import { getLocalTimeZone, today } from '@internationalized/date';
import {
  AlertCircle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Factory,
  FlaskConical,
  Layers,
  Monitor,
  Package,
  Server,
  Truck,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const appVersion = __APP_VERSION__;

// -- State --
const pendingApprovalsCount = ref(0);
const todayBookingsCount = ref(0);
const unreadNotifications = ref<any[]>([]);
const systemStatus = ref('ONLINE'); // Dummy status for now
const bookingTrendData = ref<number[]>([0, 0, 0, 0, 0, 0, 0]);

// -- Actions --
const navigateTo = (path: string) => router.push(path);

const apps = computed(() => [
  {
    id: 'bookings',
    name: 'Booking System',
    description: 'Manage rubber bookings and scheduling',
    path: '/bookings',
    icon: CalendarCheck,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    badge: todayBookingsCount.value > 0 ? todayBookingsCount.value : null,
  },
  {
    id: 'production',
    name: 'Production',
    description: 'Monitor factory output and job orders',
    path: '/admin/production',
    icon: Layers,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
  {
    id: 'qa',
    name: 'Quality Assurance',
    description: 'Lab results and incoming inspections',
    path: '/admin/qa',
    icon: FlaskConical,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    id: 'it-helpdesk',
    name: 'IT Help Desk',
    description: 'Repair requests and asset management',
    path: '/admin/it-helpdesk',
    icon: Monitor,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    id: 'receiving',
    name: 'Receiving',
    description: 'Raw material procurement tracking',
    path: '/admin/receiving',
    icon: Package,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    id: 'truck-scale',
    name: 'Truck Scale',
    description: 'Weight bridge and vehicle management',
    path: '/admin/truck-scale',
    icon: Truck,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    id: 'mrp',
    name: 'MRP System',
    description: 'PLC control and factory automation',
    path: '/mrp',
    icon: Factory,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
  },
  {
    id: 'config',
    name: 'System Config',
    description: 'Roles, permissions, and user settings',
    path: '/admin/system-status',
    icon: Server,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
  },
]);

// -- Actions --
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
        <!-- Compact Status Bar -->
        <div class="flex items-center gap-4 mt-3">
          <button
            @click="navigateTo('/admin/approvals')"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-colors"
          >
            <AlertCircle class="w-3.5 h-3.5" />
            <span class="text-[11px] font-black uppercase tracking-wider"
              >{{ pendingApprovalsCount }} Pending Approvals</span
            >
          </button>
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
          >
            <CalendarCheck class="w-3.5 h-3.5" />
            <span class="text-[11px] font-black uppercase tracking-wider"
              >{{ todayBookingsCount }} Today's Bookings</span
            >
          </div>
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100"
          >
            <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span class="text-[11px] font-black uppercase tracking-wider"
              >System {{ systemStatus }}</span
            >
          </div>
        </div>
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

    <!-- 3. App Launcher Grid -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2
          class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"
        >
          <div class="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
          Application Launcher
        </h2>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          v-for="app in apps"
          :key="app.path"
          class="group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border-slate-100 bg-white hover:border-primary/20"
          @click="navigateTo(app.path)"
        >
          <CardContent class="p-5 flex items-start gap-4">
            <div
              :class="[
                app.bg,
                app.color,
                'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm',
              ]"
            >
              <component :is="app.icon" class="w-6 h-6" />
            </div>
            <div class="space-y-1">
              <h3
                class="font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors"
              >
                {{ app.name }}
              </h3>
              <div
                v-if="app.badge !== undefined && app.badge !== null"
                class="absolute top-2 right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-white shadow-sm ring-2 ring-white"
              >
                {{ app.badge }}
              </div>
              <p class="text-[11px] font-medium text-slate-400 leading-tight">
                {{ app.description }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- 4. Secondary Content -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4 border-t border-slate-200/60">
      <!-- Left: Recent Alerts (Takes 3 cols now for better prominence) -->
      <div class="lg:col-span-3">
        <Card class="border-0 shadow-sm ring-1 ring-slate-200 h-full">
          <CardHeader class="pb-2 border-b border-slate-50">
            <CardTitle class="text-lg font-black text-slate-700 flex items-center justify-between">
              <span class="flex items-center gap-2">
                <Bell class="w-5 h-5 text-orange-500" />
                System Activity & Recent Alerts
              </span>
              <Button
                variant="ghost"
                size="sm"
                class="text-[10px] font-black uppercase tracking-widest h-7 hover:bg-slate-100"
                @click="navigateTo('/activity-center')"
              >
                View Activity Log
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <div
              v-if="unreadNotifications.length === 0"
              class="p-12 text-center text-slate-400 text-sm font-medium"
            >
              <div
                class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 class="w-8 h-8 text-slate-200" />
              </div>
              All clear! No new notifications.
            </div>
            <div v-else class="divide-y divide-slate-50">
              <div
                v-for="notif in unreadNotifications"
                :key="notif.id"
                class="p-4 hover:bg-slate-50/80 transition-all cursor-pointer flex items-start gap-4 group"
                @click="navigateTo(notif.actionUrl || '/activity-center')"
              >
                <div
                  class="mt-1 w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors"
                >
                  <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-0.5">
                    <p class="text-sm font-bold text-slate-700 leading-tight">
                      {{ notif.title }}
                    </p>
                    <span class="text-[10px] font-bold text-slate-400 uppercase"> Just Now </span>
                  </div>
                  <p class="text-xs text-slate-500 line-clamp-1 font-medium">{{ notif.message }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right: System Info/Quick Stats (Takes 1 col) -->
      <div class="space-y-6">
        <Card class="border-0 shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
          <div class="h-1 bg-primary/20"></div>
          <CardHeader class="pb-3 px-5">
            <CardTitle class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent class="px-5 pb-5 space-y-4">
            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <div class="flex items-center gap-2">
                <Server class="w-3.5 h-3.5 text-slate-400" />
                <span class="text-xs font-bold text-slate-600">Database</span>
              </div>
              <span class="text-[10px] font-black text-emerald-500 uppercase">Connected</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <div class="flex items-center gap-2">
                <Factory class="w-3.5 h-3.5 text-slate-400" />
                <span class="text-xs font-bold text-slate-600">API Server</span>
              </div>
              <span class="text-[10px] font-black text-emerald-500 uppercase">Synced</span>
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-0 shadow-sm ring-1 ring-slate-200 bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white"
        >
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Version Control
          </p>
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-black tracking-tight">V{{ appVersion }}</h4>
            <div class="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold">Stable</div>
          </div>
          <p class="text-[10px] font-medium text-slate-400 mt-4 leading-relaxed">
            All systems operational. Last security patch applied 2 hours ago.
          </p>
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
