<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-vue-next';
import { inject } from 'vue';
import { SIDEBAR_CONTEXT_KEY } from './utils';

const props = defineProps<{
  class?: string;
}>();

const { toggleSidebar } = inject(SIDEBAR_CONTEXT_KEY)!;
</script>

<template>
  <Button
    data-sidebar="trigger"
    variant="ghost"
    size="icon"
    :class="cn('h-7 w-7', props.class)"
    @click="toggleSidebar"
  >
    <PanelLeft />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
