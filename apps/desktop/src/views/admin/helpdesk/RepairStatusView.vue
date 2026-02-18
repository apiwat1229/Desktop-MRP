<script setup lang="ts">
import NewTicketForm from '@/components/helpdesk/NewTicketForm.vue';
import TicketDetailModal from '@/components/helpdesk/TicketDetailModal.vue';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { itTicketsApi, type ITTicket } from '@/services/it-tickets';
import { getLocalTimeZone } from '@internationalized/date';
import { format, formatDistanceToNowStrict, intervalToDuration } from 'date-fns';
import { CheckCircle2, Clock, Plus, Ticket, TicketPercent } from 'lucide-vue-next';
import type { DateRange } from 'reka-ui';
import { computed, inject, onMounted, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

// Injected State
const dateRange = inject<Ref<DateRange>>('helpDeskDateRange');

// State
const tickets = ref<ITTicket[]>([]);
const selectedTicket = ref<ITTicket | null>(null);
const loadingTickets = ref(false);
const isTicketModalOpen = ref(false);
const isDetailModalOpen = ref(false);

const repairTickets = computed(() => {
  return tickets.value.filter((t) => !t.isAssetRequest);
});

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(5);
const pageSizeOptions = [5, 10, 20, 50];

// Filter tickets for the selected date range and case-insensitive status checks
const filteredTickets = computed(() => {
  return repairTickets.value.filter((t) => {
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

const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredTickets.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredTickets.value.length / itemsPerPage.value));
const startItemIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1);
const endItemIndex = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, filteredTickets.value.length)
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

const getResolutionTime = (ticket: ITTicket) => {
  if (!ticket.resolvedAt) return null;
  const start = new Date(ticket.createdAt);
  const end = new Date(ticket.resolvedAt);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Open':
      return { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50/50' };
    case 'In Progress':
      return { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50/50' };
    case 'Pending':
      return { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50/50' };
    case 'Resolved':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/50' };
    case 'Closed':
      return { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50/50' };
    case 'Cancelled':
      return { dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50/50' };
    default:
      return { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50/50' };
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
          <div v-if="paginatedTickets.length" class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow class="hover:bg-transparent border-b bg-slate-50/50">
                  <TableHead
                    class="w-[80px] text-[10px] font-black uppercase tracking-widest text-slate-500 pl-6 text-start"
                    >No.</TableHead
                  >
                  <TableHead
                    class="text-[10px] font-black uppercase tracking-widest text-slate-500 text-start"
                    >Problem / Topic</TableHead
                  >
                  <TableHead
                    class="text-[10px] font-black uppercase tracking-widest text-slate-500 text-start"
                    >Requester</TableHead
                  >
                  <TableHead
                    class="text-[10px] font-black uppercase tracking-widest text-slate-500 text-start whitespace-nowrap"
                    >Category</TableHead
                  >
                  <TableHead
                    class="text-[10px] font-black uppercase tracking-widest text-slate-500 text-start"
                    >Created At</TableHead
                  >
                  <TableHead
                    class="text-[10px] font-black uppercase tracking-widest text-slate-500 text-start"
                    >Resolution</TableHead
                  >
                  <TableHead
                    class="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 pr-6"
                    >Status</TableHead
                  >
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="ticket in paginatedTickets"
                  :key="ticket.id"
                  class="cursor-pointer hover:bg-slate-50/80 transition-all group border-b border-slate-100/60"
                  @click="handleTicketClick(ticket)"
                >
                  <TableCell class="pl-6 py-4 text-start">
                    <span
                      class="font-mono text-[10px] font-black text-slate-400 group-hover:text-primary transition-colors"
                    >
                      #{{ ticket.ticketNo }}
                    </span>
                  </TableCell>
                  <TableCell class="py-4 text-start">
                    <div class="flex items-center gap-3 min-w-[200px]">
                      <div
                        class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300"
                        :class="getPriorityIconStyles(ticket.priority)"
                      >
                        <TicketPercent
                          v-if="ticket.category === 'Purchase Request'"
                          class="w-4 h-4"
                        />
                        <Ticket v-else class="w-4 h-4" />
                      </div>
                      <span
                        class="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1"
                      >
                        {{ ticket.title }}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell class="py-4 text-start">
                    <span
                      class="text-xs font-semibold text-slate-600 block truncate max-w-[120px]"
                      >{{
                        ticket.requester?.displayName || ticket.requester?.username || 'Unknown'
                      }}</span
                    >
                  </TableCell>
                  <TableCell class="py-4 text-start">
                    <span
                      class="text-[10px] font-black uppercase tracking-wider text-slate-400/80 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded shadow-sm"
                    >
                      {{ ticket.category }}
                    </span>
                  </TableCell>
                  <TableCell class="py-4 text-start">
                    <div class="flex items-center gap-2 text-slate-500">
                      <Clock class="w-3.5 h-3.5 opacity-40" />
                      <span class="text-[11px] font-medium leading-none whitespace-nowrap">{{
                        formatTicketDate(ticket.createdAt)
                      }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="py-4 text-start">
                    <template v-if="getResolutionTime(ticket)">
                      <div
                        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-100 bg-emerald-50/30 shadow-[0_1px_2px_rgba(16,185,129,0.05)]"
                      >
                        <CheckCircle2 class="w-3 h-3 text-emerald-500" />
                        <span
                          class="text-[10px] font-black text-emerald-600 tabular-nums uppercase tracking-tight"
                        >
                          {{ getResolutionTime(ticket) }}
                        </span>
                      </div>
                    </template>
                    <span v-else class="text-slate-200 font-black text-[10px] pl-2">--</span>
                  </TableCell>
                  <TableCell class="text-right py-4 pr-6">
                    <div class="inline-flex items-center justify-end w-full">
                      <div
                        :class="[
                          getStatusStyles(ticket.status).bg,
                          getStatusStyles(ticket.status).text,
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current border-opacity-10 group-hover:border-opacity-30 transition-all shadow-sm',
                        ]"
                      >
                        <div
                          :class="[
                            getStatusStyles(ticket.status).dot,
                            'w-1.5 h-1.5 rounded-full ring-2 ring-white',
                          ]"
                        ></div>
                        {{ ticket.status }}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-20 bg-muted/5">
            <div class="bg-muted p-6 rounded-full mb-4 border border-border/50">
              <Ticket class="h-10 w-10 text-muted-foreground/30" />
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
              <div>{{ startItemIndex }} - {{ endItemIndex }} of {{ filteredTickets.length }}</div>
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
      @ticketUpdated="onTicketUpdated"
      @ticketDeleted="onTicketDeleted"
    />
  </div>
</template>
