<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue';
import Navbar from '@/components/layout/Navbar.vue';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useRoute } from 'vue-router';

// Navbar serves as our custom title bar
const route = useRoute();
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <Navbar />
    <div class="flex flex-1 overflow-hidden relative">
      <SidebarProvider class="min-h-0">
        <AppSidebar class="!top-12 !h-[calc(100vh-3rem)]" />
        <SidebarInset>
          <div class="flex flex-1 flex-col gap-4 p-4 h-full overflow-y-auto">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" :key="route.path" />
              </transition>
            </router-view>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  </div>
</template>

<style scoped>
/* Adjust Sidebar for custom title bar */
:deep([data-sidebar='sidebar']) {
  top: 48px !important;
  height: calc(100vh - 48px) !important;
}

/* Adjust Sidebar Gap (to prevent content overlap) */
:deep(.peer) > div:first-child {
  height: calc(100vh - 48px) !important;
}

/* Ensure SidebarInset doesn't cause extra scroll */
:deep(main) {
  min-height: calc(100vh - 48px) !important;
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
