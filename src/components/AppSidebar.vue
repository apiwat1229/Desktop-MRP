<script setup lang="ts">
import NavMain from '@/components/NavMain.vue';
import TeamSwitcher from '@/components/TeamSwitcher.vue';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSidebarMenu } from '@/composables/useSidebarMenu';
import { ChevronLeft, Home } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();

const { toggleSidebar } = useSidebar();

const props = defineProps<{
  class?: string;
}>();

const { menuGroups } = useSidebarMenu();
</script>

<template>
  <Sidebar collapsible="offcanvas" :class="props.class">
    <SidebarHeader class="flex flex-row items-center gap-2">
      <TeamSwitcher class="flex-1" />
      <button
        class="flex size-8 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
        @click="router.push('/')"
        title="Go to Dashboard"
      >
        <Home class="size-4 opacity-70" />
      </button>
      <button
        class="flex size-8 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
        @click="toggleSidebar"
      >
        <ChevronLeft
          class="size-4 opacity-50 transition-transform group-data-[state=collapsed]:rotate-180"
        />
      </button>
    </SidebarHeader>
    <SidebarContent class="scrollbar-hide">
      <NavMain :items="menuGroups" />
    </SidebarContent>
    <SidebarFooter>
      <!-- Footer items removed as requested (Activity Center and User Profile) -->
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
