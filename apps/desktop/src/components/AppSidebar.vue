<script setup lang="ts">
import NavMain from '@/components/NavMain.vue';
import TeamSwitcher from '@/components/TeamSwitcher.vue';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useSidebarMenu } from '@/composables/useSidebarMenu';

const props = defineProps<{
  class?: string;
}>();

const { menuGroups } = useSidebarMenu();
</script>

<template>
  <Sidebar collapsible="icon" :class="props.class">
    <SidebarHeader class="flex flex-row items-center gap-2">
      <TeamSwitcher class="flex-1" />
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
