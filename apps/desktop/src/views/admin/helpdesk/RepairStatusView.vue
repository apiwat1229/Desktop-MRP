<script setup lang="ts">
import NewTicketForm from '@/components/helpdesk/NewTicketForm.vue';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { itTicketsApi, type ITTicket } from '@/services/it-tickets';
import { useAuthStore } from '@/stores/auth';
import { getLocalTimeZone } from '@internationalized/date';
import { format, formatDistanceToNowStrict, intervalToDuration } from 'date-fns';
import { Clock, Plus, Ticket, TicketPercent } from 'lucide-vue-next';
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
const isTicketModalOpen = ref(false);
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

const ticketStats = computed(() => {
  if (!tickets.value.length) {
    return {
      total: 0,
      open: 0,
      openCount: 0,
      inProgressCount: 0,
      openTrend: 0,
      avgResponse: 0,
      resolved: 0,
      resolvedTrend: 0,
    };
  }

  // Filter tickets for the selected date range
  const filteredTickets = tickets.value.filter((t) => {
    // Exclude Cancelled tickets first
    if (t.status === 'Cancelled') return false;

    if (!dateRange?.value?.start || !dateRange?.value?.end) return true;

    const ticketDate = new Date(t.createdAt);
    const start = dateRange.value.start.toDate(getLocalTimeZone());
    const end = dateRange.value.end.toDate(getLocalTimeZone());
    // Add 1 day to end date to include the full end day
    end.setDate(end.getDate() + 1);

    return ticketDate >= start && ticketDate < end;
  });

  const openTickets = filteredTickets.filter(
    (t) => t.status === 'Open' || t.status === 'In Progress'
  );
  const openCount = filteredTickets.filter((t) => t.status === 'Open').length;
  const inProgressCount = filteredTickets.filter((t) => t.status === 'In Progress').length;

  const resolvedTickets = filteredTickets.filter(
    (t) => t.status === 'Resolved' || t.status === 'Closed'
  );

  const createdInPeriod = filteredTickets.length;
  const resolvedInPeriod = resolvedTickets.length;

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
    total: filteredTickets.length,
    open: openTickets.length,
    openCount,
    inProgressCount,
    openTrend: createdInPeriod,
    resolved: resolvedTickets.length,
    resolvedTrend: resolvedInPeriod,
    avgResponse: avgTimeHours,
    bestResponse: bestTimeHours,
  };
});

const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return tickets.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(tickets.value.length / itemsPerPage.value));
const startItemIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1);
const endItemIndex = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, tickets.value.length)
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

const handleTicketSuccess = () => {
  isTicketModalOpen.value = false;
  loadTickets();
  toast.success(t('services.itHelp.request.saveSuccess') || 'Ticket submitted successfully');
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

const getPriorityIconStyles = (priority: string) => {
  switch (priority) {
    case 'Critical':
      return 'bg-red-50 text-red-600 border-red-100/50 group-hover:bg-red-100 group-hover:border-red-200';
    case 'High':
      return 'bg-orange-50 text-orange-600 border-orange-100/50 group-hover:bg-orange-100 group-hover:border-orange-200';
    case 'Medium':
      return 'bg-blue-50 text-blue-600 border-blue-100/50 group-hover:bg-blue-100 group-hover:border-blue-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100/50 group-hover:bg-slate-100 group-hover:border-slate-200';
  }
};

onMounted(() => {
  loadTickets();
});
</script>

<template>
  <div class="space-y-4">
    <template v-if="tickets.length > 0">
      <!-- Stats Header & Filter -->
      <template v-if="isITDepartment">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-muted-foreground">
            {{ t('services.itHelp.stats.overview') }}
          </h3>
        </div>

        <!-- Stats Section -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent class="p-3 text-center">
              <p class="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-tight">
                Total Tickets
              </p>
              <h4 class="text-xl font-bold">{{ ticketStats.total }}</h4>
            </CardContent>
          </Card>
          <Card class="border-l-4 border-l-blue-600 overflow-hidden">
            <CardContent class="p-3 text-center">
              <p class="text-[0.7rem] font-medium text-blue-600 uppercase tracking-tight">Open</p>
              <h4 class="text-xl font-bold text-blue-600">{{ ticketStats.openCount }}</h4>
            </CardContent>
          </Card>
          <Card class="border-l-4 border-l-primary overflow-hidden">
            <CardContent class="p-3 text-center">
              <p class="text-[0.7rem] font-medium text-primary uppercase tracking-tight">
                In Progress
              </p>
              <h4 class="text-xl font-bold text-primary">{{ ticketStats.inProgressCount }}</h4>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="p-3 text-center bg-green-50/30">
              <p
                class="text-[0.7rem] font-medium text-green-600 uppercase tracking-tight flex items-center justify-center gap-1"
              >
                Resolved
              </p>
              <h4 class="text-xl font-bold text-green-600">{{ ticketStats.resolved }}</h4>
            </CardContent>
          </Card>
          <Card class="col-span-1">
            <CardContent class="p-3 text-center">
              <p class="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-tight">
                Avg Time
              </p>
              <h4 class="text-lg font-bold">{{ ticketStats.avgResponse }}h</h4>
            </CardContent>
          </Card>
          <Card class="col-span-1">
            <CardContent class="p-3 text-center bg-primary/5">
              <p
                class="text-[0.7rem] font-medium text-primary uppercase tracking-tight flex items-center justify-center gap-1"
              >
                Best
              </p>
              <h4 class="text-lg font-bold text-primary">{{ ticketStats.bestResponse }}h</h4>
            </CardContent>
          </Card>
        </div>
      </template>

      <!-- Ticket List -->
      <Card>
        <CardHeader class="pb-3 border-b border-muted flex flex-row items-center justify-between">
          <div class="space-y-1">
            <CardTitle class="text-xl font-bold">Request Repair</CardTitle>
            <CardDescription> Report an issue or request assistance. </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="h-9 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-bold"
            @click="isTicketModalOpen = true"
          >
            <Plus class="w-4 h-4 mr-2" />
            {{ t('services.itHelp.requestRepair') || 'Request Repair' }}
          </Button>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y divide-border/50">
            <div
              v-for="ticket in paginatedTickets"
              :key="ticket.id"
              class="p-4 hover:bg-muted/30 transition-colors group flex items-center gap-4 cursor-pointer"
              @click="handleTicketClick(ticket)"
            >
              <!-- Icon -->
              <div
                class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-300"
                :class="getPriorityIconStyles(ticket.priority)"
              >
                <TicketPercent v-if="ticket.category === 'Purchase Request'" class="w-5 h-5" />
                <Ticket v-else class="w-5 h-5" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5 w-full">
                  <span class="font-semibold text-base text-foreground truncate block">
                    {{ ticket.title }}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-muted-foreground">
                  <span class="flex items-center gap-1.5 min-w-0 truncate">
                    <span class="text-muted-foreground/70">{{
                      ticket.requester?.displayName || ticket.requesterId || 'Unknown'
                    }}</span>
                    <span class="text-muted-foreground/40">&gt;</span>
                    <span class="text-primary/80 font-medium">{{ ticket.category }}</span>
                  </span>
                  <span class="text-muted-foreground/40">&bull;</span>
                  <span class="flex items-center gap-1.5 whitespace-nowrap">
                    <Clock class="w-3 h-3 text-muted-foreground/70" />
                    {{ formatTicketDate(ticket.createdAt) }}
                  </span>
                </div>
              </div>

              <!-- Right Side: Ticket No & Status -->
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

          <!-- Pagination Controls -->
          <div class="flex items-center justify-between p-4 border-t bg-muted/5">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <Select
                :model-value="itemsPerPage.toString()"
                @update:model-value="(v) => (itemsPerPage = parseInt(v))"
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
              <div>{{ startItemIndex }} - {{ endItemIndex }} of {{ tickets.length }}</div>
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

    <!-- Empty State -->
    <Card v-else>
      <CardContent class="pt-6">
        <div class="text-center py-10 text-muted-foreground">
          <Ticket class="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 class="text-lg font-medium">{{ t('services.itHelp.tickets.noTickets') }}</h3>
          <p class="mb-6">{{ t('services.itHelp.tickets.noTicketsDesc') }}</p>
          <Button variant="outline" class="gap-2" @click="isTicketModalOpen = true">
            <Plus class="w-4 h-4" />
            {{ t('services.itHelp.request.createTicket') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="isTicketModalOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{ t('services.itHelp.newTicket') }}</DialogTitle>
          <DialogDescription>{{ t('services.itHelp.tickets.subtitle') }}</DialogDescription>
        </DialogHeader>
        <NewTicketForm @success="handleTicketSuccess" @cancel="isTicketModalOpen = false" />
      </DialogContent>
    </Dialog>

    <TicketDetailModal
      v-model:open="isDetailModalOpen"
      :ticket="selectedTicket"
      @ticket-updated="onTicketUpdated"
    />
  </div>
</template>
