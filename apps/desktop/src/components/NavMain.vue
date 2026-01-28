<script setup lang="ts">
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { ChevronRight, type LucideIcon } from 'lucide-vue-next';

defineProps<{
  items: {
    title: string;
    items: {
      name: string;
      path: string;
      icon?: LucideIcon;
      permission?: string;
      items?: {
        name: string;
        path: string;
      }[];
    }[];
  }[];
}>();
</script>

<template>
  <SidebarGroup v-for="group in items" :key="group.title">
    <SidebarGroupLabel class="group-data-[collapsible=icon]:hidden">{{
      group.title
    }}</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        <Collapsible
          v-for="item in group.items"
          :key="item.name"
          as-child
          :default-open="false"
          class="group/collapsible"
        >
          <SidebarMenuItem>
            <!-- Item with submenus -->
            <CollapsibleTrigger as-child v-if="item.items?.length">
              <SidebarMenuButton :tooltip="item.name">
                <component :is="item.icon" v-if="item.icon" />
                <span>{{ item.name }}</span>
                <ChevronRight
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <!-- Standard Item -->
            <SidebarMenuButton as-child :tooltip="item.name" v-else>
              <router-link :to="item.path" active-class="bg-primary/10 text-primary font-medium">
                <component :is="item.icon" v-if="item.icon" />
                <span class="group-data-[collapsible=icon]:hidden">{{ item.name }}</span>
              </router-link>
            </SidebarMenuButton>
            <!-- Submenu Items -->
            <CollapsibleContent v-if="item.items?.length">
              <SidebarMenuSub>
                <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.name">
                  <SidebarMenuSubButton as-child>
                    <router-link
                      :to="subItem.path"
                      active-class="bg-primary/10 text-primary font-medium"
                    >
                      <span>{{ subItem.name }}</span>
                    </router-link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
