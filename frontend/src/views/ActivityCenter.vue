<script setup lang="ts">
import { format, formatDistanceToNow, isValid } from 'date-fns';
import {
  Bell,
  BellOff,
  CheckCheck,
  ClipboardCheck,
  Clock,
  RefreshCw,
  Trash2,
} from 'lucide-vue-next';
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

// UI Components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/ui/data-table/DataTable.vue';

// Custom Components
import ApprovalStatusBadge from '@/components/approval/ApprovalStatusBadge.vue';
import TicketDialog from '@/components/booking/TicketDialog.vue';

// Services & Types
import approvalsApi, { type ApprovalRequest } from '@/services/approvals';
import { bookingsApi } from '@/services/bookings';
import { notificationsApi } from '@/services/notifications';
import { socketService } from '@/services/socket';
import { handleApiError } from '@/utils/errorHandler';
import type { NotificationDto } from '@my-app/types';
import type { ColumnDef } from '@tanstack/vue-table';

const router = useRouter();
const { t } = useI18n();

// --- State Management ---
const notifications = ref<NotificationDto[]>([]);
const approvals = ref<ApprovalRequest[]>([]);
const isNotificationsLoading = ref(true);
const isApprovalsLoading = ref(true);
const currentFilter = ref<'all' | 'notification' | 'approval' | 'unread'>('all');

// Modals State
const isTicketPreviewOpen = ref(false);
const previewTicket = ref<any>(null);
const deleteDialogOpen = ref(false);
const notificationToDelete = ref<{ id: string; title: string } | null>(null);
const isErrorDialogOpen = ref(false);
const errorDialogMessage = ref('');
const showApprovalDeleteDialog = ref(false);
const approvalDeleteId = ref<string | null>(null);

// --- Utilities ---
const safeFormatDistance = (date: any) => {
  try {
    const d = new Date(date);
    if (!isValid(d)) return 'recently';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch (e) {
    return 'recently';
  }
};

const safeFormatTime = (date: any, formatStr: string) => {
  try {
    const d = new Date(date);
    if (!isValid(d)) return '--:--';
    return format(d, formatStr);
  } catch (e) {
    return '--:--';
  }
};

// --- Data Fetching ---
const fetchNotifications = async () => {
  isNotificationsLoading.value = true;
  try {
    const response = await notificationsApi.getAll();
    notifications.value = response.data || [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    toast.error('Failed to load notifications');
  } finally {
    isNotificationsLoading.value = false;
  }
};

const fetchApprovals = async () => {
  isApprovalsLoading.value = true;
  try {
    const response = await approvalsApi.getAll();
    approvals.value = response.data || [];
  } catch (error: any) {
    handleApiError(error, t('approval.list.loadError'));
  } finally {
    isApprovalsLoading.value = false;
  }
};

// --- Actions ---
const handleMarkAsRead = async (id: string) => {
  try {
    await notificationsApi.markAsRead(id);
    const notif = notifications.value.find((n) => n.id === id);
    if (notif) notif.isRead = true;
  } catch (error) {
    toast.error('Failed to mark as read');
  }
};

const handleMarkAllAsRead = async () => {
  try {
    await notificationsApi.markAllAsRead();
    notifications.value.forEach((n) => (n.isRead = true));
    toast.success('All marked as read');
  } catch (error) {
    toast.error('Failed to mark all as read');
  }
};

const handleDelete = async (id: string) => {
  try {
    await notificationsApi.delete(id);
    notifications.value = notifications.value.filter((n) => n.id !== id);
    toast.success('Notification removed');
  } catch (error) {
    toast.error('Failed to remove notification');
  }
};

const confirmApprovalDelete = async () => {
  if (!approvalDeleteId.value) return;
  try {
    await approvalsApi.softDelete(approvalDeleteId.value);
    fetchApprovals();
    toast.success('Request deleted');
  } catch (error: any) {
    handleApiError(error, t('approval.list.deleteError'));
  } finally {
    showApprovalDeleteDialog.value = false;
    approvalDeleteId.value = null;
  }
};

const handleNotificationClick = async (notification: NotificationDto) => {
  if (!notification.isRead) {
    await handleMarkAsRead(notification.id);
  }

  if (notification.actionUrl && notification.actionUrl.startsWith('/bookings/')) {
    const bookingId = notification.actionUrl.split('/').pop();
    if (bookingId) {
      try {
        const isUuid = bookingId.length > 30;
        let booking;
        if (isUuid) {
          booking = await bookingsApi.getById(bookingId);
        } else {
          const bookings = await bookingsApi.getAll({ code: bookingId });
          if (bookings && bookings.length > 0) booking = bookings[0];
        }

        if (booking) {
          previewTicket.value = {
            date: booking.date || booking.bookingDate,
            startTime: booking.startTime || booking.slot || booking.timeSlot,
            truckType: booking.truckType,
            truckRegister: booking.truckRegister || booking.truckLicensePlate,
            rubberType: booking.rubberType,
            supplierCode: booking.supplierCode || booking.supplier?.code,
            supplierName: booking.supplierName || booking.supplier?.name,
            bookingCode: booking.bookingCode,
            queueNo: booking.queueNo || booking.queueNumber,
            recorder: booking.recorder || booking.createdBy?.displayName || 'System',
            status: booking.status,
            deletedAt: booking.deletedAt,
          };
          isTicketPreviewOpen.value = true;
          return;
        }
      } catch (e) {
        console.error('Preview failed', e);
      }
      errorDialogMessage.value = 'Booking data not found or no longer available.';
      isErrorDialogOpen.value = true;
      return;
    }
  }

  if (notification.actionUrl && !notification.actionUrl.startsWith('/bookings/')) {
    router.push(notification.actionUrl);
  }
};

// --- Unified Feed Logic ---
const allActivities = computed(() => {
  const combined = [
    ...notifications.value.map((n) => ({
      id: n.id,
      type: 'notification',
      category: n.type,
      title: n.title,
      description: n.message,
      date: new Date(n.createdAt),
      isRead: n.isRead,
      raw: n,
    })),
    ...approvals.value.map((a) => ({
      id: a.id,
      type: 'approval',
      category: 'REQUEST',
      title: `Approval: ${a.requestType}`,
      description: a.reason || 'Requested for review',
      date: new Date(a.submittedAt || new Date()),
      isRead: a.status !== 'PENDING',
      status: a.status,
      raw: a,
    })),
  ];

  return combined.sort((a, b) => {
    const timeA = isValid(a.date) ? a.date.getTime() : 0;
    const timeB = isValid(b.date) ? b.date.getTime() : 0;
    return timeB - timeA;
  });
});

const filteredActivities = computed(() => {
  if (currentFilter.value === 'all') return allActivities.value;
  if (currentFilter.value === 'unread') return allActivities.value.filter((a) => !a.isRead);
  return allActivities.value.filter((a) => a.type === currentFilter.value);
});

const recentAlerts = computed(() => allActivities.value.slice(0, 8));

const unreadNotificationsCount = computed(
  () => (notifications.value || []).filter((n) => !n.isRead).length
);

// --- Unified Columns ---
const unifiedColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const isApproval = row.original.type === 'approval';
      return h(
        Badge,
        {
          variant: 'outline',
          class: isApproval
            ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm rounded-lg px-2.5 py-0.5 font-bold'
            : 'bg-primary/5 text-primary border-primary/20 shadow-sm rounded-lg px-2.5 py-0.5 font-bold',
        },
        () => [
          h(isApproval ? ClipboardCheck : Bell, { class: 'w-3 h-3 mr-1.5' }),
          row.original.type.toUpperCase(),
        ]
      );
    },
  },
  {
    accessorKey: 'title',
    header: 'Activity Details',
    cell: ({ row }) =>
      h(
        'div',
        {
          class: 'flex flex-col gap-1 cursor-pointer group py-2',
          onClick: () => {
            if (row.original.type === 'notification') {
              handleNotificationClick(row.original.raw);
            } else {
              router.push(`/approvals/${row.original.id}`);
            }
          },
        },
        [
          h('div', { class: 'flex items-center gap-2.5' }, [
            !row.original.isRead
              ? h('div', {
                  class:
                    'w-2.5 h-2.5 rounded-full bg-primary shadow-primary/30 shadow-lg ring-4 ring-primary/10',
                })
              : null,
            h(
              'span',
              {
                class: [
                  row.original.isRead
                    ? 'text-slate-500 font-semibold'
                    : 'font-black text-slate-900',
                  'group-hover:text-primary transition-all duration-300 text-[14px] tracking-tight',
                ],
              },
              row.original.title || 'No Title'
            ),
          ]),
          h(
            'span',
            { class: 'text-[12px] text-slate-400 font-medium line-clamp-1 italic pl-0' },
            row.original.description || 'No additional details provided'
          ),
        ]
      ),
  },
  {
    accessorKey: 'date',
    header: 'Time',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col gap-0.5' }, [
        h(
          'span',
          { class: 'text-[13px] font-black text-slate-800' },
          safeFormatTime(row.original.date, 'HH:mm')
        ),
        h(
          'span',
          { class: 'text-[10px] text-slate-400 font-bold uppercase tracking-wider' },
          safeFormatTime(row.original.date, 'dd MMM yyyy')
        ),
      ]),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      if (row.original.type === 'approval') {
        return h(ApprovalStatusBadge, { status: row.original.status });
      }
      return h(
        Badge,
        {
          variant: 'outline',
          class: row.original.isRead
            ? 'opacity-40 text-slate-400 border-slate-200 rounded-lg'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100 font-black rounded-lg shadow-sm',
        },
        () => (row.original.isRead ? 'Archived' : 'New')
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h('div', { class: 'flex gap-2 justify-end' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class:
              'h-9 w-9 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all',
            onClick: (e: Event) => {
              e.stopPropagation();
              if (row.original.type === 'notification') {
                notificationToDelete.value = { id: row.original.id, title: row.original.title };
                deleteDialogOpen.value = true;
              } else {
                approvalDeleteId.value = row.original.id;
                showApprovalDeleteDialog.value = true;
              }
            },
          },
          () => h(Trash2, { class: 'w-4 h-4' })
        ),
      ]),
  },
];

// --- Socket & Lifecycle ---
const setupSocket = () => {
  socketService.on('notification', (payload: any) => {
    if (payload && payload.id) {
      notifications.value.unshift(payload as NotificationDto);
      if (payload.type === 'APPROVAL_REQUEST' || payload.sourceApp === 'APPROVALS') {
        fetchApprovals();
      }
    }
  });
};

onMounted(() => {
  fetchNotifications();
  fetchApprovals();
  setupSocket();
});

onUnmounted(() => {
  socketService.off('notification');
});
</script>

<template>
  <div class="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen max-w-[1600px] mx-auto">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200"
    >
      <div class="space-y-1">
        <div
          class="flex items-center gap-2 text-primary font-bold tracking-tighter text-sm uppercase"
        >
          <Bell class="w-4 h-4" />
          <span>Central Notification Hub</span>
        </div>
        <h1 class="text-4xl font-black tracking-tight text-slate-900">Activity Center</h1>
      </div>

      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          @click="
            fetchNotifications();
            fetchApprovals();
          "
          class="bg-white border-slate-200 text-slate-600 hover:text-primary rounded-xl px-4 h-11 shadow-sm transition-all hover:shadow-md"
        >
          <RefreshCw
            class="w-4 h-4 mr-2"
            :class="{ 'animate-spin': isNotificationsLoading || isApprovalsLoading }"
          />
          Refresh Data
        </Button>
        <Button
          size="sm"
          variant="default"
          @click="handleMarkAllAsRead"
          :disabled="unreadNotificationsCount === 0"
          class="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6 h-11 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <CheckCheck class="w-4 h-4 mr-2" />
          Clear All Unread
        </Button>
      </div>
    </div>

    <!-- Quick Overview (Recent Highlights) -->
    <section class="space-y-6">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200">
            <Clock class="w-4 h-4" />
          </div>
          <h2 class="font-bold text-slate-800 uppercase tracking-widest text-xs">
            Recently Received
          </h2>
        </div>
        <Badge variant="outline" class="bg-amber-50 text-amber-700 border-amber-200 font-bold px-3">
          Latest 8 Entries
        </Badge>
      </div>

      <div
        v-if="recentAlerts.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1 font-sans"
      >
        <Card
          v-for="alert in recentAlerts"
          :key="alert.type + '-' + alert.id"
          class="group relative border-none shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col bg-white rounded-2xl"
          @click="
            alert.type === 'notification'
              ? handleNotificationClick(alert.raw as any)
              : router.push(`/approvals/${alert.id}`)
          "
        >
          <div
            :class="[
              'absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5',
              alert.type === 'approval' ? 'bg-purple-500' : 'bg-primary',
              alert.isRead ? 'opacity-20' : 'opacity-100',
            ]"
          ></div>

          <CardHeader class="p-4 pb-2">
            <div class="flex items-center justify-between mb-2">
              <Badge
                variant="secondary"
                :class="
                  alert.type === 'approval'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-primary/10 text-primary'
                "
                class="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg"
              >
                {{ alert.type }}
              </Badge>
              <div class="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                <Clock class="w-3 h-3" />
                <span>{{ safeFormatDistance(alert.date) }}</span>
              </div>
            </div>
            <CardTitle
              class="text-[14px] font-black tracking-tight leading-snug group-hover:text-primary transition-colors"
              :class="alert.isRead ? 'text-slate-400 font-bold' : 'text-slate-900'"
            >
              {{ alert.title || 'Activity' }}
            </CardTitle>
          </CardHeader>

          <CardContent class="p-4 pt-0 flex-1">
            <p
              class="text-[11px] leading-relaxed line-clamp-2"
              :class="alert.isRead ? 'text-slate-400' : 'text-slate-600 font-medium'"
            >
              {{ alert.description || '-' }}
            </p>
          </CardContent>

          <div
            class="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span class="text-[9px] font-bold text-primary uppercase tracking-wider"
              >Click to view details</span
            >
            <RefreshCw class="w-3 h-3 text-primary animate-spin-slow" />
          </div>
        </Card>
      </div>

      <div
        v-else
        class="w-full border-2 border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center p-20 rounded-3xl"
      >
        <div class="p-4 rounded-full bg-slate-100 text-slate-300 mb-4">
          <BellOff class="w-12 h-12 opacity-50" />
        </div>
        <h3 class="text-lg font-bold text-slate-400">All caught up!</h3>
        <p class="text-sm font-medium text-slate-400 italic">
          No recent activity detected in your feed.
        </p>
      </div>
    </section>

    <!-- Unified Activity Feed -->
    <section class="space-y-6">
      <div
        class="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden"
      >
        <!-- Feed Filter & Header -->
        <div
          class="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/30"
        >
          <div class="flex items-center gap-4">
            <div class="p-2.5 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <ClipboardCheck class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-2xl font-black text-slate-900 tracking-tight">Main Activity Feed</h2>
              <div class="flex items-center gap-2 mt-0.5">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span class="text-xs font-bold text-slate-500"
                  >{{ filteredActivities.length }} entries filtered</span
                >
              </div>
            </div>
          </div>

          <div
            class="flex items-center gap-1.5 bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner"
          >
            <Button
              v-for="f in ['all', 'notification', 'approval', 'unread']"
              :key="f"
              variant="ghost"
              size="sm"
              class="h-8 px-3 rounded-xl text-[10px] font-black transition-all capitalize"
              :class="
                currentFilter === f
                  ? 'bg-white text-primary shadow-xl shadow-primary/10 border border-slate-200/50 scale-105'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 border-transparent'
              "
              @click="currentFilter = f as any"
            >
              {{ f === 'unread' ? 'Unread' : f + (f === 'all' ? '' : 's') }}
            </Button>
          </div>
        </div>

        <!-- Unified Table -->
        <div class="p-0 overflow-x-auto">
          <DataTable
            :columns="unifiedColumns"
            :data="filteredActivities"
            :loading="isNotificationsLoading || isApprovalsLoading"
            class="border-none min-w-[800px]"
          />
        </div>
      </div>
    </section>

    <!-- Modals -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent class="rounded-3xl border-none shadow-2xl p-8">
        <AlertDialogHeader>
          <div
            class="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4"
          >
            <Trash2 class="w-8 h-8" />
          </div>
          <AlertDialogTitle class="text-2xl font-black tracking-tight"
            >Delete Notification</AlertDialogTitle
          >
          <AlertDialogDescription class="text-slate-500 font-medium leading-relaxed">
            Are you sure you want to delete
            <span class="text-slate-900 font-bold">"{{ notificationToDelete?.title }}"</span>? This
            action is permanent and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="mt-8 gap-3">
          <AlertDialogCancel class="rounded-xl h-12 px-8 border-slate-200 text-slate-600 font-bold"
            >Nevermind</AlertDialogCancel
          >
          <AlertDialogAction
            class="bg-destructive hover:bg-destructive/90 rounded-xl h-12 px-8 font-black text-white shadow-lg shadow-destructive/20 transition-all"
            @click="handleDelete(notificationToDelete!.id)"
          >
            Confirm Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog v-model:open="showApprovalDeleteDialog">
      <AlertDialogContent class="rounded-3xl border-none shadow-2xl p-8">
        <AlertDialogHeader>
          <div
            class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4"
          >
            <Trash2 class="w-8 h-8" />
          </div>
          <AlertDialogTitle class="text-2xl font-black tracking-tight"
            >Discard Approval Request</AlertDialogTitle
          >
          <AlertDialogDescription class="text-slate-500 font-medium leading-relaxed">
            This will remove the request from your active feed. You can still access it via the
            specific module logs if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="mt-8 gap-3">
          <AlertDialogCancel class="rounded-xl h-12 px-8 border-slate-200 text-slate-600 font-bold"
            >Go Back</AlertDialogCancel
          >
          <AlertDialogAction
            class="bg-amber-600 hover:bg-amber-700 rounded-xl h-12 px-8 font-black text-white shadow-lg shadow-amber-200 transition-all"
            @click="confirmApprovalDelete"
          >
            Discard Request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <TicketDialog v-model:open="isTicketPreviewOpen" :ticket="previewTicket" />

    <AlertDialog v-model:open="isErrorDialogOpen">
      <AlertDialogContent class="rounded-3xl border-none shadow-2xl p-8">
        <AlertDialogHeader>
          <div
            class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4"
          >
            <BellOff class="w-8 h-8" />
          </div>
          <AlertDialogTitle class="text-2xl font-black tracking-tight"
            >Resource Not Available</AlertDialogTitle
          >
          <AlertDialogDescription class="text-slate-500 font-medium leading-relaxed">
            {{ errorDialogMessage }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="mt-8">
          <AlertDialogAction
            @click="isErrorDialogOpen = false"
            class="bg-slate-900 hover:bg-slate-800 rounded-xl h-12 px-8 font-bold text-white transition-all"
          >
            Understood
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
