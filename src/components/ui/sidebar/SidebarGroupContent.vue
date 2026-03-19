<script setup lang="ts">
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <div :class="cn('w-full text-sm', props.class)" data-sidebar="group-content">
    <slot />
  </div>
</template>
