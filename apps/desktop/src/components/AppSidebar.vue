<script setup lang="ts">
import NavMain from '@/components/NavMain.vue';
import NavSecondary from '@/components/NavSecondary.vue';
import NavUser from '@/components/NavUser.vue';
import TeamSwitcher from '@/components/TeamSwitcher.vue';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useSidebarMenu } from '@/composables/useSidebarMenu';

const { menuGroups } = useSidebarMenu();
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader class="flex flex-row items-center gap-2">
      <TeamSwitcher class="flex-1" />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="menuGroups" />
    </SidebarContent>
    <SidebarFooter>
      <NavSecondary class="mt-auto" />
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
