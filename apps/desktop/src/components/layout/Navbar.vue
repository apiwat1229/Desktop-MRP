<script setup lang="ts">
import TicketDialog from '@/components/booking/TicketDialog.vue';
import AppearanceSettings from '@/components/settings/AppearanceSettings.vue';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar/index';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSidebar } from '@/components/ui/sidebar';
import { usePermissions } from '@/composables/usePermissions';
import approvalsApi from '@/services/approvals';
import { bookingsApi } from '@/services/bookings';
import { notificationsApi } from '@/services/notifications';
import { socketService } from '@/services/socket';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore } from '@/stores/navigation';
import { DateFormatter, getLocalTimeZone } from '@internationalized/date';
import type { NotificationDto } from '@my-app/types';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellOff,
  Calendar as CalendarIcon,
  LogOut,
  Menu,
  RotateCw,
  Search as SearchIcon,
  Settings,
  User,
} from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const authStore = useAuthStore();
const navigationStore = useNavigationStore();
const router = useRouter();
const route = useRoute();
const showThemeSettings = ref(false);
const isTicketPreviewOpen = ref(false);
const previewTicket = ref<any>(null);
const isErrorDialogOpen = ref(false);
const errorDialogMessage = ref('');
const isCloseConfirmOpen = ref(false);
const isCalendarOpen = ref(false);

const { toggleSidebar } = useSidebar();

const { isAdmin, hasPermission } = usePermissions();

const props = defineProps<{
  showBrand?: boolean;
}>();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const userInitials = () => {
  if (!authStore.user?.firstName) return 'U';
  return `${authStore.user.firstName.charAt(0)}${authStore.user.lastName ? authStore.user.lastName.charAt(0) : ''}`;
};

const isElectron = computed(() => {
  return typeof window !== 'undefined' && !!(window as any).ipcRenderer;
});

const pageTitle = computed(() => {
  if (navigationStore.title) return navigationStore.title;
  const name = route.name?.toString() || '';
  if (name === 'Home') return 'Dashboard';
  if (name === 'AdminDashboard') return 'Admin Panel';
  if (name === 'ProjectTimeline') return t('services.projectTimeline.name');
  if (name === 'ActivityCenter') return 'Activity Center';
  return name;
});

// Date Handling
const df = new DateFormatter('en-GB', {
  dateStyle: 'medium',
});

const formattedDate = computed(() => {
  if (!navigationStore.date) return '-';
  return df.format(navigationStore.date.toDate(getLocalTimeZone()));
});

const { t } = useI18n();

// --- Notifications Logic ---
const unreadNotifications = ref<NotificationDto[]>([]);
const unreadCount = computed(() => unreadNotifications.value.length);

const pendingApprovalCount = ref(0);
// let pollingInterval: NodeJS.Timeout;

const fetchPendingApprovals = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    // Check if user has permission first to avoid unnecessary calls
    if (isAdmin.value || hasPermission('approvals:approve')) {
      const res = await approvalsApi.getAll({ status: 'PENDING' });
      // Assuming res.data is the array
      pendingApprovalCount.value = res.data?.length || 0;
    }
  } catch (error) {
    console.error('Failed to fetch pending approvals', error);
  }
};

const fetchUnreadNotifications = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    const res = await notificationsApi.getUnread();
    unreadNotifications.value = res.data || [];
  } catch (error) {
    console.error('Failed to fetch unread notifications', error);
  }
};

const handleMarkAsRead = async (id: string) => {
  try {
    await notificationsApi.markAsRead(id);
    unreadNotifications.value = unreadNotifications.value.filter((n) => n.id !== id);
  } catch (error) {
    console.error('Failed to mark as read', error);
  }
};

const handleViewAll = () => {
  router.push('/activity-center');
};

// Window Controls
const handleMinimize = () => {
  (window as any).ipcRenderer?.window?.minimize();
};

const handleMaximize = () => {
  (window as any).ipcRenderer?.window?.maximize();
};

const handleClose = () => {
  isCloseConfirmOpen.value = true;
};

const confirmClose = () => {
  (window as any).ipcRenderer?.window?.close();
  isCloseConfirmOpen.value = false;
};

const handleRefresh = () => {
  window.location.reload();
};

const handleNotificationClick = async (notification: NotificationDto) => {
  await handleMarkAsRead(notification.id);

  if (notification.actionUrl && notification.actionUrl.startsWith('/bookings')) {
    let bookingId = '';
    if (notification.actionUrl.includes('?code=')) {
      bookingId = notification.actionUrl.split('?code=')[1];
    } else {
      const parts = notification.actionUrl.split('/');
      bookingId = parts[parts.length - 1];
    }

    if (bookingId) {
      let booking;
      try {
        const isUuid = bookingId.length > 30;
        if (isUuid) {
          booking = await bookingsApi.getById(bookingId);
        } else {
          const bookings = await bookingsApi.getAll({ code: bookingId });
          if (bookings && bookings.length > 0) {
            booking = bookings[0];
          }
        }
      } catch (error) {
        console.error('Failed to fetch booking preview:', error);
      }

      if (booking) {
        setTimeout(() => {
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
            recorder:
              booking.recorder ||
              booking.createdBy?.displayName ||
              booking.createdBy?.username ||
              'System',
            status: booking.status,
            deletedAt: booking.deletedAt,
          };
          isTicketPreviewOpen.value = true;
        }, 100);
        return;
      } else {
        if (
          notification.title.toLowerCase().includes('cancel') ||
          notification.message.toLowerCase().includes('cancel')
        ) {
          setTimeout(() => {
            errorDialogMessage.value = 'Booking was cancelled and data is no longer available.';
            isErrorDialogOpen.value = true;
          }, 100);
          return;
        }
      }
    }
  }

  if (notification.actionUrl && !notification.actionUrl.startsWith('/bookings')) {
    router.push(notification.actionUrl);
  } else if (!notification.actionUrl) {
    router.push('/activity-center');
  }
};

// Moved accessors to setup scope, init in onMounted below

// Ensure we join the room if user data loads late
// Logic moved to SocketService.connect() 'connect' listener to avoid race conditions
/* if (authStore.user?.id) {
    socketService.joinRoom(authStore.user.id);
  } */

const lastNotification = ref<{ title: string; message: string; time: number } | null>(null);
const handleNotificationSocket = (newNotification: any) => {
  // Frontend Deduplication Safeguard
  // Prevent duplicate notifications (same title/message) within 2 seconds, even if IDs differ
  const now = Date.now();
  if (lastNotification.value) {
    const isSameContent =
      lastNotification.value.title === newNotification.title &&
      lastNotification.value.message === newNotification.message;
    const isRecent = now - lastNotification.value.time < 2000; // 2000ms window

    if (isSameContent && isRecent) {
      return;
    }
  }

  // Update last notification tracker
  lastNotification.value = {
    title: newNotification.title,
    message: newNotification.message,
    time: now,
  };

  // Add new notification to list
  if (!unreadNotifications.value.some((n) => n.id === newNotification.id)) {
    unreadNotifications.value.unshift(newNotification);

    // Show Toast with type-based styling
    const getToastStyles = (type: string) => {
      const styles = {
        SUCCESS: {
          textColor: 'text-green-600',
          iconColor: '!text-green-600',
          buttonBg: 'bg-green-600',
          buttonHover: 'hover:bg-green-700',
        },
        APPROVE: {
          textColor: 'text-teal-600',
          iconColor: '!text-teal-600',
          buttonBg: 'bg-teal-600',
          buttonHover: 'hover:bg-teal-700',
        },
        ERROR: {
          textColor: 'text-red-600',
          iconColor: '!text-red-600',
          buttonBg: 'bg-red-600',
          buttonHover: 'hover:bg-red-700',
        },
        WARNING: {
          textColor: 'text-yellow-600',
          iconColor: '!text-yellow-600',
          buttonBg: 'bg-yellow-600',
          buttonHover: 'hover:bg-yellow-700',
        },
        INFO: {
          textColor: 'text-blue-600',
          iconColor: '!text-blue-600',
          buttonBg: 'bg-blue-600',
          buttonHover: 'hover:bg-blue-700',
        },
        REQUEST: {
          textColor: 'text-purple-600',
          iconColor: '!text-purple-600',
          buttonBg: 'bg-purple-600',
          buttonHover: 'hover:bg-purple-700',
        },
      };
      return styles[type as keyof typeof styles] || styles.INFO;
    };

    const style = getToastStyles(newNotification.type);

    const toastOptions = {
      description: newNotification.message,
      duration: 5000, // 5 seconds
      unstyled: false, // Keep Sonner's base styling
      action: {
        label: 'View',
        onClick: () => handleNotificationClick(newNotification),
      },
      classNames: {
        toast: 'bg-white border-2 shadow-lg',
        title: `font-semibold ${style.textColor}`,
        description: 'text-gray-600',
        actionButton: `${style.buttonBg} ${style.buttonHover} text-white border-0 font-medium !important`,
        icon: `w-6 h-6 ${style.iconColor}`,
      },
    };

    switch (newNotification.type) {
      case 'SUCCESS':
      case 'APPROVE':
        toast.success(newNotification.title, toastOptions);
        break;
      case 'ERROR':
        toast.error(newNotification.title, toastOptions);
        break;
      case 'WARNING':
        toast.warning(newNotification.title, toastOptions);
        break;
      case 'INFO':
      case 'REQUEST':
      default:
        toast.info(newNotification.title, toastOptions);
        break;
    }
  }

  // Refresh pending approvals if notification relates to approvals
  if (
    newNotification.sourceApp === 'APPROVALS' ||
    newNotification.type === 'REQUEST' ||
    newNotification.type === 'APPROVE' ||
    newNotification.title.toLowerCase().includes('approval')
  ) {
    fetchPendingApprovals();
  }
};

onMounted(() => {
  fetchUnreadNotifications();
  fetchPendingApprovals();
  socketService.connect();
  socketService.on('notification', handleNotificationSocket);
  window.addEventListener('refresh-approvals-count', fetchPendingApprovals);
});

watch(
  () => authStore.user,
  (newUser: any) => {
    if (newUser?.id) {
      socketService.joinRoom(newUser.id);
    }
  }
);

onUnmounted(() => {
  // if (pollingInterval) clearInterval(pollingInterval);
  socketService.off('notification', handleNotificationSocket);
  window.removeEventListener('refresh-approvals-count', fetchPendingApprovals);
});
</script>

<template>
  <header
    class="h-12 border-b border-border bg-card/80 backdrop-blur pr-6 flex items-center justify-between sticky top-0 z-50 draggable-region"
  >
    <div class="flex items-center gap-0 no-drag">
      <div class="w-12 flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          class="h-9 w-9 text-muted-foreground hover:text-foreground"
          @click="toggleSidebar"
        >
          <Menu class="w-5 h-5" />
        </Button>
      </div>

      <div class="flex items-center gap-1 border-l pl-2">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
          :disabled="!router.options.history.state.back"
          @click="router.back()"
        >
          <ArrowLeft class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-muted-foreground hover:text-foreground"
          @click="handleRefresh"
        >
          <RotateCw class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
          :disabled="!router.options.history.state.forward"
          @click="router.forward()"
        >
          <ArrowRight class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Centered Title -->
    <div
      class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
    >
      <span class="text-lg text-foreground font-bold tracking-tight">
        {{ pageTitle }}
      </span>
    </div>

    <!-- Right Section (Controls + Profile) -->
    <div class="flex items-center gap-2 ml-4 no-drag shrink-0">
      <!-- Global Search/Date Controls -->
      <div v-if="navigationStore.showControls" class="flex items-center gap-2">
        <!-- Search Popover -->
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
            >
              <SearchIcon class="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-80 p-2" align="end" :side-offset="12">
            <div class="flex items-center gap-2">
              <SearchIcon class="h-4 w-4 text-muted-foreground" />
              <Input
                v-model="navigationStore.searchQuery"
                placeholder="Search items..."
                class="h-8 border-none focus-visible:ring-0 shadow-none"
                auto-focus
              />
            </div>
          </PopoverContent>
        </Popover>

        <!-- Date Popover -->
        <Popover v-model:open="isCalendarOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-8 min-w-[140px] px-3 justify-center text-foreground font-semibold bg-primary/5 hover:bg-primary/10 transition-all border-primary/20 hover:border-primary/30 rounded-lg shadow-none"
            >
              <span class="text-xs">{{ formattedDate }}</span>
              <CalendarIcon class="ml-2 h-3.5 w-3.5 text-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="end" :side-offset="12">
            <Calendar
              :model-value="navigationStore.date as any"
              @update:model-value="
                (date: any) => {
                  navigationStore.date = date;
                  isCalendarOpen = false;
                }
              "
              mode="single"
            />
          </PopoverContent>
        </Popover>

        <div class="h-4 w-px bg-border/60 mx-1"></div>
      </div>

      <!-- User Profile -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="relative h-9 w-9 rounded-full p-0">
            <Avatar class="h-9 w-9 rounded-full border-2 border-background shadow-sm">
              <AvatarImage :src="authStore.userAvatarUrl" :alt="authStore.user?.username || ''" />
              <AvatarFallback class="rounded-full bg-primary/10 text-primary">{{
                userInitials()
              }}</AvatarFallback>
            </Avatar>
            <!-- Notification Badge on Avatar -->
            <span
              v-if="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-in zoom-in duration-300"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-80 p-0 overflow-hidden border shadow-xl rounded-xl"
          align="end"
          side="bottom"
          :side-offset="8"
        >
          <!-- User Profile Brief -->
          <div
            class="px-5 py-5 pb-4 bg-gradient-to-br from-primary/5 via-transparent to-transparent"
          >
            <div class="flex items-center gap-4">
              <div class="relative group">
                <Avatar
                  class="h-12 w-12 rounded-full ring-2 ring-primary/20 ring-offset-2 transition-transform group-hover:scale-105"
                >
                  <AvatarImage
                    :src="authStore.userAvatarUrl"
                    :alt="authStore.user?.username || ''"
                  />
                  <AvatarFallback class="bg-primary text-primary-foreground font-bold">
                    {{ userInitials() }}
                  </AvatarFallback>
                </Avatar>
                <div
                  class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background"
                  title="Online"
                ></div>
              </div>
              <div class="flex flex-col min-w-0">
                <p class="text-base font-bold text-foreground leading-tight truncate">
                  {{ authStore.user?.displayName || authStore.user?.username }}
                </p>
                <p class="text-xs text-muted-foreground truncate opacity-80 mt-0.5">
                  {{ authStore.user?.email }}
                </p>
              </div>
            </div>
          </div>

          <div class="px-2 pb-2">
            <!-- Main Actions Grid -->
            <div class="grid grid-cols-2 gap-2 p-1">
              <button
                @click="router.push('/profile')"
                class="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-muted/40 hover:bg-primary/10 hover:text-primary transition-all group"
              >
                <div
                  class="p-2 rounded-full bg-background shadow-sm transition-transform group-hover:scale-110"
                >
                  <User class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-semibold">Profile</span>
              </button>
              <button
                @click="showThemeSettings = true"
                class="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-muted/40 hover:bg-primary/10 hover:text-primary transition-all group"
              >
                <div
                  class="p-2 rounded-full bg-background shadow-sm transition-transform group-hover:scale-110"
                >
                  <Settings class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-semibold">Theme Settings</span>
              </button>
            </div>

            <DropdownMenuSeparator class="mx-2 my-2" />

            <!-- Notifications Feed Area -->
            <div class="mx-1 rounded-xl bg-muted/30 border border-border/50 overflow-hidden">
              <div
                class="px-4 py-2 flex items-center justify-between border-b border-border/40 bg-muted/20"
              >
                <div class="flex items-center gap-2">
                  <Bell class="w-3.5 h-3.5 text-muted-foreground" />
                  <span
                    class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-80"
                  >
                    Recent Alerts
                  </span>
                </div>
                <span
                  v-if="unreadCount > 0"
                  class="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full"
                >
                  {{ unreadCount }}
                </span>
              </div>

              <div class="max-h-[200px] overflow-y-auto">
                <div
                  v-if="unreadCount === 0"
                  class="py-10 flex flex-col items-center justify-center"
                >
                  <div
                    class="h-10 w-10 rounded-full bg-background flex items-center justify-center mb-2 shadow-sm italic opacity-20"
                  >
                    <BellOff class="w-5 h-5" />
                  </div>
                  <p class="text-[11px] text-muted-foreground font-medium">All clear! No alerts</p>
                </div>

                <template v-else>
                  <div
                    v-for="notification in unreadNotifications.slice(0, 3)"
                    :key="notification.id"
                    class="group relative flex flex-col gap-0.5 p-3 hover:bg-primary/5 cursor-pointer border-b border-border/30 last:border-0 transition-colors"
                    @click="handleNotificationClick(notification)"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <span
                        class="font-bold text-[11px] text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors italic"
                      >
                        {{ notification.title }}
                      </span>
                      <span class="text-[9px] text-muted-foreground whitespace-nowrap opacity-60">
                        {{
                          formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })
                        }}
                      </span>
                    </div>
                    <p
                      class="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed opacity-90"
                    >
                      {{ notification.message }}
                    </p>
                  </div>
                </template>
              </div>

              <div class="border-t border-border/40">
                <button
                  @click="handleViewAll"
                  class="w-full py-2.5 text-[10px] font-bold text-primary/80 hover:text-primary hover:bg-primary/5 transition-all uppercase tracking-widest"
                >
                  View Activity Center
                </button>
              </div>
            </div>

            <div class="mt-2 space-y-0.5 p-1">
              <DropdownMenuItem
                @click="handleLogout"
                class="flex items-center h-10 px-3 rounded-lg text-destructive focus:bg-destructive/10 cursor-pointer transition-colors group"
              >
                <div
                  class="h-7 w-7 rounded-md bg-destructive/10 flex items-center justify-center group-focus:bg-destructive/20"
                >
                  <LogOut class="h-4 w-4" />
                </div>
                <span class="text-sm font-bold ml-3 italic">Sign Out</span>
              </DropdownMenuItem>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <template v-if="isElectron">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          title="Minimize"
          @click="handleMinimize"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
          >
            <path
              d="M2.25 7.5H12.75"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          title="Maximize"
          @click="handleMaximize"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-3.5 h-3.5"
          >
            <path
              d="M2.5 2.5H12.5V12.5H2.5V2.5Z"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 hover:bg-red-500 hover:text-white"
          title="Close"
          @click="handleClose"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
          >
            <path
              d="M3.75 3.75L11.25 11.25"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M11.25 3.75L3.75 11.25"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Button>
      </template>
    </div>
    <!-- Theme Settings Dialog -->
    <Dialog v-model:open="showThemeSettings">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Theme Settings</DialogTitle>
          <DialogDescription>Customize the appearance of the application.</DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <AppearanceSettings />
        </div>
      </DialogContent>
    </Dialog>

    <!-- Ticket Preview Dialog -->
    <TicketDialog v-model:open="isTicketPreviewOpen" :ticket="previewTicket" />

    <!-- Error/Info Dialog (For Missing Data) -->
    <AlertDialog v-model:open="isErrorDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Data Unavailable</AlertDialogTitle>
          <AlertDialogDescription>
            {{ errorDialogMessage }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction @click="isErrorDialogOpen = false">OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Close Confirmation Dialog -->
    <AlertDialog v-model:open="isCloseConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Application?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to close the application? Any unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmClose">Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </header>
</template>

<style scoped>
/* Draggable window region */
.draggable-region {
  -webkit-app-region: drag;
  app-region: drag;
}

/* Make interactive elements clickable */
.no-drag,
.no-drag * {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

@keyframes bell-ring {
  0%,
  100% {
    transform: rotate(0);
  }
  15% {
    transform: rotate(15deg);
  }
  30% {
    transform: rotate(-15deg);
  }
  45% {
    transform: rotate(10deg);
  }
  60% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(5deg);
  }
  85% {
    transform: rotate(-5deg);
  }
}

.animate-bell-ring {
  animation: bell-ring 2s cubic-bezier(0.19, 1, 0.22, 1) infinite;
  transform-origin: top center;
}
</style>
