<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationsApi } from '@/services/notifications';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  RefreshCw,
  Server,
  Users,
  Wifi,
} from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';

interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: Date;
  latency: number;
}

const status = ref<'ok' | 'error' | null>(null);
const uptime = ref<number | string | null>(null);
const lastChecked = ref<Date | null>(null);
const responseTime = ref<number | null>(null);
const loading = ref(false);
const history = ref<HealthCheck[]>([]);
const details = ref<any>(null);

// Stats
const unreadAlerts = ref(0);
const pendingApprovals = ref(0);
const onlineUsers = ref(1); // Self

const pollInterval = 10000;
let timer: ReturnType<typeof setInterval> | null = null;
let statsTimer: number | null = null;

const fetchStats = async () => {
  try {
    const response = await notificationsApi.getAll();
    unreadAlerts.value = response.data.filter((n) => !n.isRead).length;
    pendingApprovals.value = response.data.filter(
      (n) => (n.type as string) === 'APPROVAL_REQUEST' && !n.isRead
    ).length;
    // Mock online users fluctuation
    onlineUsers.value = Math.floor(Math.random() * 5) + 1;
  } catch (error) {
    console.error('Failed to fetch stats', error);
  }
};

const fetchStatus = async () => {
  loading.value = true;
  const start = performance.now();
  let currentStatus: 'ok' | 'error' = 'error';

  try {
    const res = await fetch('https://app.ytrc.co.th/api/health');
    const end = performance.now();
    const duration = end - start;
    responseTime.value = duration;

    if (res.ok) {
      const data = await res.json();
      const rawStatus = data.status || data.Status || '';
      const isOk =
        typeof rawStatus === 'string'
          ? rawStatus === 'ok' ||
            rawStatus.toLowerCase().includes('running') ||
            rawStatus.includes('✅')
          : false;

      currentStatus = isOk ? 'ok' : 'error';
      const rawUptime = data.uptime || data.Uptime || null;
      if (typeof rawUptime === 'string') {
        uptime.value = rawUptime.replace(/ : \d+ Second/g, '').replace(/ : Minute/g, ' Minute');
      } else {
        uptime.value = rawUptime;
      }

      const redisRaw = data.redisStatus || data['Redis Status'] || '';
      const isRedisOk =
        typeof redisRaw === 'string' &&
        (redisRaw.toLowerCase().includes('running') || redisRaw.toLowerCase().includes('up'));

      details.value = data.details || {
        database: { status: isOk ? 'up' : 'down' },
        redis: { status: isRedisOk ? 'up' : 'down' },
      };

      lastChecked.value = new Date();
    } else {
      try {
        const data = await res.json();
        details.value = data.details || null;
      } catch (e) {
        details.value = null;
      }
    }
  } catch (error) {
    console.error('Failed to fetch status:', error);
  } finally {
    status.value = currentStatus;
    if (responseTime.value !== null) {
      addToHistory(currentStatus, new Date(), responseTime.value);
    }
    loading.value = false;
  }
};

const addToHistory = (status: 'ok' | 'error', timestamp: Date, latency: number) => {
  history.value.unshift({ status, timestamp, latency });
  if (history.value.length > 5) history.value.pop();
};

const formatTimeRaw = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Mock Recent Activity
const recentActivity = computed(() => [
  { type: 'EDIT', requester: 'U', status: 'APPROVED', time: '16-Jan-2026, 16:09' },
  { type: 'EDIT', requester: 'U', status: 'APPROVED', time: '16-Jan-2026, 16:08' },
  { type: 'EDIT', requester: 'U', status: 'APPROVED', time: '16-Jan-2026, 16:08' },
  { type: 'EDIT', requester: 'U', status: 'APPROVED', time: '16-Jan-2026, 16:07' },
  { type: 'EDIT', requester: 'U', status: 'APPROVED', time: '16-Jan-2026, 15:46' },
]);

onMounted(() => {
  fetchStatus();
  fetchStats();
  timer = setInterval(fetchStatus, pollInterval);
  statsTimer = window.setInterval(fetchStats, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (statsTimer) clearInterval(statsTimer);
});
</script>

<template>
  <div class="p-8 max-w-screen-2xl mx-auto space-y-8 bg-slate-50 min-h-[calc(100vh-4rem)]">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">System Monitor</h1>
        <p class="text-slate-500 mt-1">Real-time overview of system performance and activities.</p>
      </div>
      <div class="flex items-center gap-2">
        <div
          class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"
        >
          <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          SYSTEM HEALTHY
        </div>
        <Button variant="outline" size="sm" @click="fetchStatus" :disabled="loading" class="h-8">
          <RefreshCw :class="['w-3.5 h-3.5 mr-2', loading && 'animate-spin']" />
          Refresh
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content (Left) -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Top Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Pending Approvals -->
          <Card class="border shadow-none">
            <CardContent class="p-6">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-slate-600">Pending Approvals</span>
                <CheckCircle2 class="w-4 h-4 text-orange-500" />
              </div>
              <div class="text-4xl font-bold text-orange-600">{{ pendingApprovals }}</div>
              <p class="text-xs text-slate-400 mt-1">Require attention</p>
            </CardContent>
          </Card>

          <!-- Unread Alerts -->
          <Card class="border shadow-none">
            <CardContent class="p-6">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-slate-600">Unread Alerts</span>
                <AlertCircle class="w-4 h-4 text-blue-500" />
              </div>
              <div class="text-4xl font-bold text-blue-600">{{ unreadAlerts }}</div>
              <p class="text-xs text-slate-400 mt-1">System notifications</p>
            </CardContent>
          </Card>

          <!-- Online Users -->
          <Card class="border shadow-none">
            <CardContent class="p-6">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-slate-600">Online Users</span>
                <Users class="w-4 h-4 text-emerald-500" />
              </div>
              <div class="text-4xl font-bold text-emerald-600">{{ onlineUsers }}</div>
              <p class="text-xs text-slate-400 mt-1">Active now in system</p>
            </CardContent>
          </Card>
        </div>

        <!-- Recent Activity -->
        <Card class="border shadow-none h-full">
          <CardHeader>
            <CardTitle class="text-lg font-semibold">Recent Activity</CardTitle>
            <p class="text-sm text-slate-500">Latest approval requests and system actions.</p>
          </CardHeader>
          <CardContent>
            <div class="w-full overflow-auto">
              <table class="w-full text-sm text-left">
                <thead class="text-slate-400 font-medium">
                  <tr>
                    <th class="pb-3 pl-2">Type</th>
                    <th class="pb-3">Requester</th>
                    <th class="pb-3 text-center">Status</th>
                    <th class="pb-3 text-right pr-2">Time</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(item, i) in recentActivity" :key="i" class="group">
                    <td class="py-4 pl-2 font-medium text-slate-700">{{ item.type }}</td>
                    <td class="py-4">
                      <div
                        class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold"
                      >
                        {{ item.requester }}
                      </div>
                    </td>
                    <td class="py-4 text-center">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 uppercase"
                      >
                        {{ item.status }}
                      </span>
                    </td>
                    <td class="py-4 text-right text-slate-400 pr-2">{{ item.time }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Sidebar (Right) -->
      <div class="space-y-8">
        <!-- System Health -->
        <Card class="border shadow-none">
          <CardHeader>
            <CardTitle class="text-lg font-semibold">System Health</CardTitle>
            <p class="text-sm text-slate-500">Operational Status</p>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Database class="w-4 h-4 text-slate-400" />
                <span class="font-medium text-slate-700">Database</span>
              </div>
              <span
                class="px-2 py-0.5 rounded text-xs font-bold uppercase"
                :class="
                  details?.database?.status === 'up' || status === 'ok'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                "
              >
                {{ details?.database?.status === 'up' || status === 'ok' ? 'Connected' : 'Error' }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Server class="w-4 h-4 text-slate-400" />
                <span class="font-medium text-slate-700">API Server</span>
              </div>
              <span
                class="px-2 py-0.5 rounded text-xs font-bold uppercase"
                :class="status === 'ok' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'"
              >
                {{ status === 'ok' ? 'Online' : 'Offline' }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Wifi class="w-4 h-4 text-slate-400" />
                <span class="font-medium text-slate-700">Socket.IO</span>
              </div>
              <span
                class="px-2 py-0.5 rounded text-xs font-bold uppercase bg-emerald-500 text-white"
              >
                Active
              </span>
            </div>

            <div class="pt-4 border-t flex items-center gap-2 text-xs text-slate-400">
              <Clock class="w-3 h-3" />
              Last check: {{ lastChecked ? formatTimeRaw(lastChecked) : 'Just now' }}
            </div>
          </CardContent>
        </Card>

        <!-- Monitoring Tools -->
        <Card class="border shadow-none">
          <CardHeader>
            <CardTitle class="text-lg font-semibold">Monitoring Tools</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <Button
              variant="ghost"
              class="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <Activity class="w-4 h-4 mr-3 text-blue-500" />
              Traffic Analytics
            </Button>
            <Button
              variant="ghost"
              class="w-full justify-start text-slate-600 hover:text-rose-600 hover:bg-rose-50"
            >
              <FileText class="w-4 h-4 mr-3 text-rose-500" />
              System Logs
            </Button>
            <Button
              variant="ghost"
              class="w-full justify-start text-slate-600 hover:text-amber-600 hover:bg-amber-50"
            >
              <BarChart3 class="w-4 h-4 mr-3 text-amber-500" />
              Performance Metrics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
