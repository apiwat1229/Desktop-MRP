<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useRoute } from 'vue-router';

// If SiteHeader is missing, we can implement a basic header or verify its existence.
// For now assuming the user wants to keep the header logic if it existed.
// But Step 844 removed it. Step 817 deleted it.
// I'll create a simple header inline or leave it empty for now.

const route = useRoute();
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <div class="flex flex-1 flex-col gap-4 p-4">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
