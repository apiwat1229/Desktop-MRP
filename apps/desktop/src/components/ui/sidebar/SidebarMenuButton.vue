<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Slot } from 'radix-vue';

const props = withDefaults(
  defineProps<{
    size?: 'default' | 'sm' | 'lg';
    variant?: 'default' | 'outline';
    isActive?: boolean;
    class?: string;
    tooltip?: string;
    asChild?: boolean;
  }>(),
  {
    size: 'default',
    variant: 'default',
    isActive: false,
  }
);
</script>

<template>
  <component
    :is="asChild ? Slot : 'button'"
    data-sidebar="menu-button"
    :data-size="size"
    :data-active="isActive"
    :class="
      cn(
        'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
        size === 'sm' && 'text-xs',
        size === 'lg' && 'text-base',
        props.class
      )
    "
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>
