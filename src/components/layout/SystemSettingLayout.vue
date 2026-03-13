<script setup lang="ts">
import NavMain from '@/components/NavMain.vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar/index';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sidebar, SidebarContent, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useSystemSettingMenu } from '@/composables/useSidebarMenu';
import { useAuthStore } from '@/stores/auth';
import { ChevronLeft, LogOut, Settings2, User } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

const { menuGroups } = useSystemSettingMenu();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const userInitials = () => {
  if (!authStore.user?.firstName) return 'U';
  return `${authStore.user.firstName.charAt(0)}${authStore.user.lastName ? authStore.user.lastName.charAt(0) : ''}`;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <SidebarProvider :default-open="true" class="min-h-0 flex flex-col">
      <!-- Navbar -->
      <header
        class="h-12 border-b border-border bg-card/80 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-50 shrink-0"
      >
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <Settings2 class="h-5 w-5 text-primary" />
            <span class="font-semibold text-foreground">System Setting</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs" @click="router.push('/')">
            <ChevronLeft class="h-3.5 w-3.5" />
            Back to App
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="h-9 w-9 rounded-full p-0">
                <Avatar class="h-9 w-9 rounded-full border-2 border-background shadow-sm">
                  <AvatarImage
                    :src="authStore.userAvatarUrl"
                    :alt="authStore.user?.username || ''"
                  />
                  <AvatarFallback class="rounded-full bg-primary/10 text-primary">{{
                    userInitials()
                  }}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <div class="px-3 py-2">
                <p class="text-sm font-semibold truncate">
                  {{ authStore.user?.displayName || authStore.user?.username }}
                </p>
                <p class="text-xs text-muted-foreground truncate">{{ authStore.user?.email }}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="router.push('/profile')">
                <User class="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                @click="handleLogout"
                class="text-destructive focus:text-destructive"
              >
                <LogOut class="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden relative">
        <!-- Sidebar -->
        <Sidebar collapsible="none" class="!top-12 !h-[calc(100vh-3rem)]">
          <SidebarContent class="scrollbar-hide">
            <NavMain :items="menuGroups" />
          </SidebarContent>
        </Sidebar>

        <!-- Main Content -->
        <SidebarInset>
          <div class="flex flex-1 flex-col gap-4 p-4 h-full overflow-y-auto">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" :key="route.path" />
              </transition>
            </router-view>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  </div>
</template>

<style scoped>
:deep([data-sidebar='sidebar']) {
  top: 48px !important;
  height: calc(100vh - 48px) !important;
}
:deep(.peer) > div:first-child {
  height: calc(100vh - 48px) !important;
}
:deep(main) {
  min-height: calc(100vh - 48px) !important;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
