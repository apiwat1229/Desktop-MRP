<script setup lang="ts">
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Box } from 'lucide-vue-next';
import { ref } from 'vue';

const { toggleSidebar } = useSidebar();

const activeTeam = ref({
  name: 'YTRC Center',
  logo: Box,
  plan: 'Enterprise',
});

const appVersion = __APP_VERSION__;
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        @click="toggleSidebar"
      >
        <div
          class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:!size-8"
        >
          <component
            :is="activeTeam.logo"
            class="size-4 text-white group-data-[collapsible=icon]:!size-6"
          />
        </div>
        <div
          class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
        >
          <span class="truncate font-semibold">{{ activeTeam.name }}</span>
          <span class="truncate text-xs">v{{ appVersion }}</span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
