<script setup lang="ts">
import { cn } from '@/lib/utils';
import { computed, provide, ref } from 'vue';
import {
  SIDEBAR_CONTEXT_KEY,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
} from './utils';

const props = withDefaults(
  defineProps<{
    defaultOpen?: boolean;
    open?: boolean;
    class?: string;
  }>(),
  {
    defaultOpen: true,
    open: undefined,
  }
);

const emits = defineEmits<{
  'update:open': [value: boolean];
}>();

// Internal state for desktop
const _open = ref(props.defaultOpen);
const open = computed({
  get: () => props.open ?? _open.value,
  set: (val) => {
    if (props.open !== undefined) {
      emits('update:open', val);
    } else {
      _open.value = val;
    }
    // Logic to save state to cookie could go here
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${val}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  },
});

const setOpen = (value: boolean) => {
  open.value = value;
};

const toggleSidebar = () => {
  setOpen(!open.value);
};

const state = computed(() => (open.value ? 'expanded' : 'collapsed'));

provide(SIDEBAR_CONTEXT_KEY, {
  state,
  open,
  setOpen,
  toggleSidebar,
});
</script>

<template>
  <div
    :class="
      cn(
        'group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar',
        props.class
      )
    "
    :style="{
      '--sidebar-width': SIDEBAR_WIDTH,
      '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
    }"
  >
    <slot />
  </div>
</template>
