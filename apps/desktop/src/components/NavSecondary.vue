<script setup lang="ts">
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { notificationsApi } from '@/services/notifications';
import { useAuthStore } from '@/stores/auth';
import { Bell, ClipboardCheck } from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';

const unreadCount = ref(0);
const pendingApprovalsCount = ref(0); // Placeholder to be connected to API later
const authStore = useAuthStore();
let intervalId: number | null = null;

const fetchCounts = async () => {
  try {
    const response = await notificationsApi.getAll();
    unreadCount.value = response.data.filter((n) => !n.isRead).length;
    // For pending approvals, we'd need a similar API or filter from notifications if they are approval types.
    // Assuming for now pending approvals could be distinct or just placeholder.
    // If pending approvals are notifications with type APPROVAL_REQUEST, we can filter:
    pendingApprovalsCount.value = response.data.filter(
      (n) => (n.type as string) === 'APPROVAL_REQUEST' && !n.isRead
    ).length;
  } catch (error) {
    console.error('Failed to fetch stats', error);
  }
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchCounts();
    // Poll every minute (optional, or use socket)
    intervalId = window.setInterval(fetchCounts, 60000);
  }
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        <!-- My Notifications -->
        <SidebarMenuItem>
          <SidebarMenuButton as-child>
            <router-link to="/my-notifications">
              <Bell class="mr-2 h-4 w-4" />
              <span>My Notifications</span>
            </router-link>
          </SidebarMenuButton>
          <SidebarMenuBadge
            v-if="unreadCount > 0"
            class="bg-red-500 text-white min-w-[1.25rem] h-5"
            >{{ unreadCount > 99 ? '99+' : unreadCount }}</SidebarMenuBadge
          >
        </SidebarMenuItem>

        <!-- Approval Requests -->
        <SidebarMenuItem>
          <SidebarMenuButton as-child>
            <router-link to="/approvals">
              <ClipboardCheck class="mr-2 h-4 w-4" />
              <span>Approval Requests</span>
            </router-link>
          </SidebarMenuButton>
          <SidebarMenuBadge v-if="pendingApprovalsCount > 0">{{
            pendingApprovalsCount
          }}</SidebarMenuBadge>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
