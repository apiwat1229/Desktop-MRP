<script setup lang="ts">
import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <!-- Using a plain div instead of ComboboxContent to avoid Radix Vue's hideOthers()
       calling aria-hidden on ancestor Dialog elements (WAI-ARIA aria-hidden conflict). -->
  <div :class="cn('max-h-[300px] overflow-y-auto overflow-x-hidden', props.class)">
    <div role="presentation">
      <slot />
    </div>
  </div>
</template>
