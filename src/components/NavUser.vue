<script setup lang="ts">
import AppearanceSettings from '@/components/settings/AppearanceSettings.vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/auth';
import { Bell, ChevronsUpDown, LogOut, Settings, User as UserIcon } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

useSidebar();
const authStore = useAuthStore();
const router = useRouter();

const userInitials = computed(() => {
  if (!authStore.user?.firstName) return 'U';
  return `${authStore.user.firstName.charAt(0)}${authStore.user.lastName ? authStore.user.lastName.charAt(0) : ''}`;
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <SidebarMenuButton
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage :src="authStore.userAvatarUrl" :alt="authStore.user?.firstName" />
                <AvatarFallback class="rounded-lg">{{ userInitials }}</AvatarFallback>
              </Avatar>
              <div
                class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
              >
                <span class="truncate font-semibold"
                  >{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</span
                >
                <span class="truncate text-xs">{{
                  authStore.user?.email || authStore.user?.username
                }}</span>
              </div>
              <ChevronsUpDown class="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="right"
            align="end"
            :side-offset="4"
          >
            <DropdownMenuLabel class="p-0 font-normal">
              <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar class="h-8 w-8 rounded-lg">
                  <AvatarImage :src="authStore.userAvatarUrl" :alt="authStore.user?.firstName" />
                  <AvatarFallback class="rounded-lg">{{ userInitials }}</AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold"
                    >{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</span
                  >
                  <span class="truncate text-xs">{{
                    authStore.user?.email || authStore.user?.username
                  }}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem @click="router.push('/profile')">
                <UserIcon class="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem @click="router.push('/activity-center')">
                <Bell class="mr-2 h-4 w-4" />
                Activity Center
              </DropdownMenuItem>
              <DialogTrigger as-child>
                <DropdownMenuItem>
                  <Settings class="mr-2 h-4 w-4" />
                  Theme Settings
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleLogout" class="text-red-600 focus:text-red-600">
              <LogOut class="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Theme Settings</DialogTitle>
            <DialogDescription>Customize the appearance of the application.</DialogDescription>
          </DialogHeader>
          <div class="py-4 max-h-[80vh] overflow-y-auto overflow-x-hidden px-1 scrollbar-hide">
            <AppearanceSettings />
          </div>
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
