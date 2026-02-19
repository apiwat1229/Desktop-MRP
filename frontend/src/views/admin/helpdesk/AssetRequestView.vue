<script setup lang="ts">
import AssetRequestForm from '@/components/helpdesk/AssetRequestForm.vue';
import TicketDetailModal from '@/components/helpdesk/TicketDetailModal.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { itTicketsApi, type ITTicket } from '@/services/it-tickets';
import { useAuthStore } from '@/stores/auth';
import { getLocalTimeZone } from '@internationalized/date';
import { format, formatDistanceToNowStrict, intervalToDuration } from 'date-fns';
import { CheckCircle2, Clock, Monitor, Package, Plus, Zap } from 'lucide-vue-next';
import type { DateRange } from 'reka-ui';
import { computed, inject, onMounted, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const authStore = useAuthStore();

// Injected State
const dateRange = inject<Ref<DateRange>>('helpDeskDateRange');

// State
const tickets = ref<ITTicket[]>([]);
const loadingTickets = ref(false);
const isAssetModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const selectedTicket = ref<ITTicket | null>(null);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(5);
const pageSizeOptions = [5, 10, 20, 50];

const isITDepartment = computed(() => {
  const userDept = authStore.user?.department;
  return userDept === 'Information Technology' || userDept === 'เทคโนโลยีสารสนเทศ (IT)';
});

const assetRequests = computed(() => {
  return tickets.value.filter((t) => t.isAssetRequest);
});

// Filter asset requests for the selected date range and case-insensitive status checks
const filteredAssetRequests = computed(() => {
  return assetRequests.value.filter((t) => {
    // Exclude Cancelled tickets first (case-insensitive)
    if (t.status?.toLowerCase() === 'cancelled') return false;

    if (!dateRange?.value?.start || !dateRange?.value?.end) return true;

    const ticketDate = new Date(t.createdAt);
    const start = dateRange.value.start.toDate(getLocalTimeZone());
    const end = dateRange.value.end.toDate(getLocalTimeZone());
    // Add 1 day to end date to include the full end day
    end.setDate(end.getDate() + 1);

    return ticketDate >= start && ticketDate < end;
  });
});

const assetStats = computed(() => {
  const currentFiltered = filteredAssetRequests.value;
  if (!currentFiltered.length) {
    return {
      total: 0,
      open: 0,
      openCount: 0,
      inProgressCount: 0,
      resolved: 0,
      avgResponse: '0.00',
      bestResponse: '0.00',
    };
  }

  const openTickets = currentFiltered.filter(
    (t) => t.status?.toLowerCase() === 'open' || t.status?.toLowerCase() === 'in progress'
  );
  const openCount = currentFiltered.filter((t) => t.status?.toLowerCase() === 'open').length;
  const inProgressCount = currentFiltered.filter(
    (t) => t.status?.toLowerCase() === 'in progress'
  ).length;
  const resolvedTickets = currentFiltered.filter((t) => {
    const s = t.status?.toLowerCase();
    return s === 'resolved' || s === 'closed' || s === 'approved';
  });

  let totalResolutionTime = 0;
  let minTimeMs = Infinity;

  resolvedTickets.forEach((t) => {
    const created = new Date(t.createdAt);
    const updated = new Date(t.updatedAt);
    const diff = updated.getTime() - created.getTime();
    totalResolutionTime += diff;
    if (diff < minTimeMs) {
      minTimeMs = diff;
    }
  });

  const avgTimeMs = resolvedTickets.length ? totalResolutionTime / resolvedTickets.length : 0;
  const avgTimeHours = (avgTimeMs / (1000 * 60 * 60)).toFixed(2);
  const bestTimeHours = minTimeMs !== Infinity ? (minTimeMs / (1000 * 60 * 60)).toFixed(2) : '0.00';

  return {
    total: currentFiltered.length,
    open: openTickets.length,
    openCount,
    inProgressCount,
    resolved: resolvedTickets.length,
    avgResponse: avgTimeHours,
    bestResponse: bestTimeHours,
  };
});

const paginatedAssetRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredAssetRequests.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.ceil(filteredAssetRequests.value.length / itemsPerPage.value)
);
const startItemIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1);
const endItemIndex = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, filteredAssetRequests.value.length)
);

// Methods
const loadTickets = async () => {
  loadingTickets.value = true;
  try {
    tickets.value = await itTicketsApi.getAll();
  } catch (error) {
    console.error('Failed to load tickets:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    loadingTickets.value = false;
  }
};

const handleTicketClick = (ticket: ITTicket) => {
  selectedTicket.value = ticket;
  isDetailModalOpen.value = true;
};

const onTicketUpdated = (updatedTicket: ITTicket) => {
  const index = tickets.value.findIndex((t) => t.id === updatedTicket.id);
  if (index !== -1) {
    tickets.value[index] = updatedTicket;
  }
  selectedTicket.value = updatedTicket;
};

const onTicketDeleted = (ticketId: string) => {
  tickets.value = tickets.value.filter((t) => t.id !== ticketId);
  selectedTicket.value = null;
};

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const formatTicketDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const formatted = format(date, 'dd MMM yyyy, HH:mm');

  const now = new Date();
  const duration = intervalToDuration({ start: date, end: now });

  let timeAgo = '';
  if (duration.years) timeAgo = formatDistanceToNowStrict(date, { addSuffix: true });
  else if (duration.months) timeAgo = formatDistanceToNowStrict(date, { addSuffix: true });
  else if (duration.days) {
    timeAgo = `${duration.days}d ${duration.hours ?? 0}h ago`;
  } else if (duration.hours) {
    timeAgo = `${duration.hours}h ${duration.minutes ?? 0}m ago`;
  } else {
    timeAgo = `${duration.minutes ?? 0}m ago`;
  }

  return `${formatted} (${timeAgo})`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open':
      return 'bg-blue-100 text-blue-800';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Pending':
      return 'bg-orange-100 text-orange-800';
    case 'Resolved':
      return 'bg-green-100 text-green-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

onMounted(() => {
  loadTickets();
});
</script>

<template>
  <div class="space-y-4">
    <div v-if="isITDepartment && assetRequests.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-muted-foreground">Assets Overview</h3>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent class="p-3 text-center">
            <p class="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-tight">
              Total
            </p>
            <h4 class="text-xl font-bold">{{ assetStats.total }}</h4>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-3 text-center">
            <p class="text-[0.7rem] font-medium text-blue-600 uppercase tracking-tight">Open</p>
            <h4 class="text-xl font-bold text-blue-600">{{ assetStats.openCount }}</h4>
          </CardContent>
        </Card>
        <Card class="border-l-4 border-l-primary overflow-hidden">
          <CardContent class="p-3 text-center">
            <p
              class="text-[0.7rem] font-medium text-primary uppercase tracking-tight flex items-center justify-center gap-1"
            >
              <Clock class="w-3 h-3" /> In Progress
            </p>
            <h4 class="text-xl font-bold">{{ assetStats.inProgressCount }}</h4>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-3 text-center bg-green-50/30">
            <p
              class="text-[0.7rem] font-medium text-green-600 uppercase tracking-tight flex items-center justify-center gap-1"
            >
              <CheckCircle2 class="w-3 h-3" /> Resolved
            </p>
            <h4 class="text-xl font-bold text-green-600">{{ assetStats.resolved }}</h4>
          </CardContent>
        </Card>
        <Card class="col-span-1">
          <CardContent class="p-3 text-center">
            <p class="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-tight">
              Avg Time
            </p>
            <h4 class="text-lg font-bold">{{ assetStats.avgResponse }}h</h4>
          </CardContent>
        </Card>
        <Card class="col-span-1">
          <CardContent class="p-3 text-center bg-primary/5">
            <p
              class="text-[0.7rem] font-medium text-primary uppercase tracking-tight flex items-center justify-center gap-1"
            >
              <Zap class="w-3 h-3 font-bold" /> Best
            </p>
            <h4 class="text-lg font-bold text-primary">{{ assetStats.bestResponse }}h</h4>
          </CardContent>
        </Card>
      </div>
    </div>

    <template v-if="assetRequests.length > 0">
      <Card>
        <CardHeader class="pb-3 border-b border-muted flex flex-row items-center justify-between">
          <div class="space-y-1">
            <CardTitle class="text-xl font-bold">{{
              t('services.itHelp.tabs.assetRequest')
            }}</CardTitle>
            <CardDescription> Track your equipment and hardware requests. </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="h-9 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-bold"
            @click="isAssetModalOpen = true"
          >
            <Package class="w-4 h-4 mr-2" />
            {{ t('services.itHelp.requestEquipment') }}
          </Button>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="paginatedAssetRequests.length" class="divide-y divide-border/50">
            <div
              v-for="ticket in paginatedAssetRequests"
              :key="ticket.id"
              class="p-4 hover:bg-muted/30 transition-colors group flex items-center gap-4"
            >
              <div
                class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border bg-slate-50 text-slate-600 border-slate-100"
              >
                <Monitor class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5 w-full">
                  <span
                    class="font-semibold text-base text-foreground truncate block hover:underline cursor-pointer"
                    @click="handleTicketClick(ticket)"
                  >
                    {{ ticket.title }}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-muted-foreground">
                  <div class="flex items-center gap-1.5">
                    <span class="text-muted-foreground/70">{{ ticket.category || 'Asset' }}</span>
                    <span v-if="ticket.assetId" class="text-muted-foreground/40">&gt;</span>
                    <span v-if="ticket.assetId"> {{ ticket.quantity }} items</span>
                  </div>
                  <span class="text-muted-foreground/40">&bull;</span>
                  <span class="flex items-center gap-1.5">
                    <Clock class="w-3 h-3 text-muted-foreground/70" />
                    {{ formatTicketDate(ticket.createdAt) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0 pl-4">
                <Badge
                  variant="secondary"
                  class="text-[0.625rem] h-5 px-1.5 font-mono font-medium text-muted-foreground bg-muted border border-border rounded pointer-events-none"
                >
                  {{ ticket.ticketNo }}
                </Badge>
                <Badge
                  :class="[
                    getStatusColor(ticket.status),
                    'px-2.5 py-0.5 text-[0.625rem] font-bold border-0 rounded uppercase tracking-wide pointer-events-none',
                  ]"
                >
                  {{ ticket.status }}
                </Badge>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-20 bg-muted/5">
            <div class="bg-muted p-6 rounded-full mb-4 border border-border/50">
              <Monitor class="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 class="text-lg font-bold text-foreground tracking-tight">
              {{ t('common.table.noResults') }}
            </h3>
            <p class="text-muted-foreground text-sm font-medium mt-1">
              {{ t('production.history.empty') || 'Try changing the date or search query.' }}
            </p>
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center justify-between p-4 border-t bg-muted/5">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <Select
                :model-value="itemsPerPage.toString()"
                @update:model-value="(v: string) => (itemsPerPage = parseInt(v))"
              >
                <SelectTrigger class="h-8 w-[60px] bg-background">
                  <SelectValue :placeholder="itemsPerPage.toString()" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="size in pageSizeOptions" :key="size" :value="size.toString()">
                    {{ size }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="flex items-center gap-4 text-sm text-muted-foreground">
              <div>
                {{ startItemIndex }} - {{ endItemIndex }} of {{ filteredAssetRequests.length }}
              </div>
              <div class="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-8 px-3 bg-background"
                  :disabled="currentPage === 1"
                  @click="handlePageChange(currentPage - 1)"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-8 px-3 bg-background"
                  :disabled="currentPage === totalPages"
                  @click="handlePageChange(currentPage + 1)"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
    <Card v-else>
      <CardContent class="pt-6">
        <div class="text-center py-10 text-muted-foreground">
          <Monitor class="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 class="text-lg font-medium">{{ t('services.itHelp.assets.noAssets') }}</h3>
          <p class="mb-6">{{ t('services.itHelp.assets.noAssetsDesc') }}</p>
          <Button variant="outline" class="gap-2" @click="isAssetModalOpen = true">
            <Plus class="w-4 h-4" />
            {{ t('services.itHelp.assets.requestNew') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="isAssetModalOpen">
      <DialogContent class="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{{ t('services.itHelp.request.title') }}</DialogTitle>
          <DialogDescription>{{ t('services.itHelp.request.subtitle') }}</DialogDescription>
        </DialogHeader>
        <AssetRequestForm @success="isAssetModalOpen = false" @cancel="isAssetModalOpen = false" />
      </DialogContent>
    </Dialog>
    <TicketDetailModal
      v-model:open="isDetailModalOpen"
      :ticket="selectedTicket"
      @ticketUpdated="onTicketUpdated"
      @ticketDeleted="onTicketDeleted"
    />
  </div>
</template>
