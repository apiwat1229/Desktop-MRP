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
        console.warn('Preview failed', e);
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
            ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
            : 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm',
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
          class: 'flex flex-col gap-0.5 cursor-pointer group py-1',
          onClick: () => {
            if (row.original.type === 'notification') {
              handleNotificationClick(row.original.raw);
            } else {
              router.push(`/approvals/${row.original.id}`);
            }
          },
        },
        [
          h('div', { class: 'flex items-center gap-2' }, [
            !row.original.isRead
              ? h('div', {
                  class: 'w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-200 shadow-md',
                })
              : null,
            h(
              'span',
              {
                class: [
                  row.original.isRead
                    ? 'text-slate-500 font-medium'
                    : 'font-extrabold text-slate-900',
                  'group-hover:text-primary transition-colors text-sm tracking-tight',
                ],
              },
              row.original.title || 'No Title'
            ),
          ]),
          h(
            'span',
            { class: 'text-[11px] text-slate-400 line-clamp-1 italic' },
            row.original.description || '-'
          ),
        ]
      ),
  },
  {
    accessorKey: 'date',
    header: 'Time',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h(
          'span',
          { class: 'text-xs font-bold text-slate-700' },
          safeFormatTime(row.original.date, 'HH:mm')
        ),
        h(
          'span',
          { class: 'text-[10px] text-slate-400' },
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
            ? 'opacity-60 text-slate-400'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100 font-bold',
        },
        () => (row.original.isRead ? 'Read' : 'New')
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h('div', { class: 'flex gap-1 justify-end' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class:
              'h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-full',
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
  <div class="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200"
    >
      <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <h1 class="text-3xl font-black tracking-tighter text-slate-900">Activity Center</h1>
        <div class="hidden md:block w-px h-6 bg-slate-300"></div>
        <p class="text-slate-500 font-medium tracking-tight">
          Manage all your notifications & requests in one place.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          @click="
            fetchNotifications();
            fetchApprovals();
          "
          class="bg-white border-slate-200 text-slate-600 hover:text-primary rounded-full px-4 shadow-sm"
        >
          <RefreshCw
            class="w-4 h-4 mr-2"
            :class="{ 'animate-spin': isNotificationsLoading || isApprovalsLoading }"
          />
          Refresh
        </Button>
        <Button
          size="sm"
          variant="default"
          @click="handleMarkAllAsRead"
          :disabled="unreadNotificationsCount === 0"
          class="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-full px-6 shadow-md shadow-emerald-200"
        >
          <CheckCheck class="w-4 h-4 mr-2" />
          Mark all as read
        </Button>
      </div>
    </div>

    <!-- Quick Overview (Recent Highlights) -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 px-1">
        <div class="p-1.5 rounded-lg bg-amber-100 text-amber-600 font-bold">
          <Clock class="w-4 h-4" />
        </div>
        <h2 class="font-bold text-slate-800 uppercase tracking-widest text-[10px]">
          Recently Received
        </h2>
      </div>

      <div class="w-full overflow-x-auto scrollbar-hide">
        <div v-if="recentAlerts.length > 0" class="flex gap-4 pb-2 px-1">
          <Card
            v-for="alert in recentAlerts"
            :key="alert.type + '-' + alert.id"
            class="w-[320px] shrink-0 border-none shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col bg-white"
            @click="
              alert.type === 'notification'
                ? handleNotificationClick(alert.raw as any)
                : router.push(`/approvals/${alert.id}`)
            "
          >
            <div
              :class="[
                'absolute left-0 top-0 bottom-0 w-1.5',
                alert.type === 'approval' ? 'bg-purple-500' : 'bg-blue-500',
                alert.isRead ? 'opacity-30' : '',
              ]"
            ></div>
            <CardHeader class="p-4 pb-2 space-y-0">
              <div class="flex items-center justify-between mb-2">
                <Badge
                  variant="secondary"
                  :class="
                    alert.type === 'approval'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-blue-50 text-blue-700'
                  "
                  class="text-[10px] font-black uppercase px-2 py-0"
                >
                  {{ alert.type }}
                </Badge>
                <span class="text-[9px] text-slate-400 font-bold italic">
                  {{ safeFormatDistance(alert.date) }}
                </span>
              </div>
              <CardTitle
                class="text-sm font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1"
                :class="alert.isRead ? 'text-slate-400' : 'text-slate-900'"
              >
                {{ alert.title || 'Activity' }}
              </CardTitle>
            </CardHeader>
            <CardContent class="p-4 pt-0 flex-1">
              <p
                class="text-[11px] leading-relaxed line-clamp-2"
                :class="alert.isRead ? 'text-slate-400 font-medium' : 'text-slate-600'"
              >
                {{ alert.description || '-' }}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card
          v-else
          class="w-full border-2 border-dashed border-slate-200 shadow-none bg-slate-50/50 flex flex-col items-center justify-center p-12 rounded-xl"
        >
          <BellOff class="w-10 h-10 text-slate-300 mb-2 opacity-50" />
          <p class="text-sm font-medium text-slate-400 italic">All caught up! No recent activity</p>
        </Card>
      </div>
    </section>

    <!-- Unified Activity Feed -->
    <section class="space-y-4">
      <div
        class="bg-white rounded-xl border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden"
      >
        <!-- Feed Filter & Header -->
        <div
          class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30"
        >
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-black text-slate-900 tracking-tighter">Activity Feed</h2>
            <Badge
              variant="outline"
              class="bg-white text-slate-500 border-slate-200 font-bold px-3"
            >
              {{ filteredActivities.length }} Total
            </Badge>
          </div>

          <div
            class="flex items-center gap-1.5 bg-slate-200/50 p-1 rounded-xl border border-slate-200"
          >
            <Button
              v-for="f in ['all', 'notification', 'approval', 'unread']"
              :key="f"
              variant="ghost"
              size="sm"
              class="h-10 px-6 rounded-xl text-xs font-black transition-all capitalize"
              :class="
                currentFilter === f
                  ? 'bg-white text-emerald-700 shadow-lg border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/30'
              "
              @click="currentFilter = f as any"
            >
              {{ f === 'unread' ? 'Unread' : f + 's' }}
            </Button>
          </div>
        </div>

        <!-- Unified Table -->
        <div class="p-0">
          <DataTable
            :columns="unifiedColumns"
            :data="filteredActivities"
            :loading="isNotificationsLoading || isApprovalsLoading"
            class="border-none"
          />
        </div>
      </div>
    </section>

    <!-- Modals -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent class="rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle class="font-black">Delete Notification</AlertDialogTitle>
          <AlertDialogDescription>
            Delete "{{ notificationToDelete?.title }}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="rounded-full">Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive hover:bg-destructive/90 rounded-full font-bold"
            @click="handleDelete(notificationToDelete!.id)"
          >
            Delete Permanent
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog v-model:open="showApprovalDeleteDialog">
      <AlertDialogContent class="rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle class="font-black">Discard Request</AlertDialogTitle>
          <AlertDialogDescription
            >Confirm removal of this approval request from your feed?</AlertDialogDescription
          >
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="rounded-full">Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 rounded-full font-bold"
            @click="confirmApprovalDelete"
          >
            Discard Request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <TicketDialog v-model:open="isTicketPreviewOpen" :ticket="previewTicket" />

    <AlertDialog v-model:open="isErrorDialogOpen">
      <AlertDialogContent class="rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle class="font-black">Data Not Found</AlertDialogTitle>
          <AlertDialogDescription>{{ errorDialogMessage }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction @click="isErrorDialogOpen = false" class="rounded-full font-bold"
            >Close</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
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
