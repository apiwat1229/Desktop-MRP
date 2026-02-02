<script setup lang="ts">
import { computed } from 'vue';

const isElectron = computed(() => {
  return typeof window !== 'undefined' && !!(window as any).ipcRenderer;
});

const handleMinimize = () => {
  (window as any).ipcRenderer?.window?.minimize();
};

const handleMaximize = () => {
  (window as any).ipcRenderer?.window?.maximize();
};

const handleClose = () => {
  // We can emit a close event or directly close
  // For simplicity, we can optionaly show a confirm dialog in the parent
  // but here we just call the IPC directly or emit
  (window as any).ipcRenderer?.window?.close();
};

defineProps<{
  showCloseConfirm?: boolean;
}>();
</script>

<template>
  <div v-if="isElectron" class="flex items-center gap-1">
    <button
      @click="handleMinimize"
      class="h-8 w-8 flex items-center justify-center rounded-sm hover:bg-muted transition-colors"
      title="Minimize"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
      >
        <path
          d="M2.25 7.5H12.75"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <button
      @click="handleMaximize"
      class="h-8 w-8 flex items-center justify-center rounded-sm hover:bg-muted transition-colors"
      title="Maximize"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-3.5 h-3.5"
      >
        <path
          d="M2.5 2.5H12.5V12.5H2.5V2.5Z"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <button
      @click="handleClose"
      class="h-8 w-8 flex items-center justify-center rounded-sm hover:bg-red-500 hover:text-white transition-colors"
      title="Close"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
      >
        <path
          d="M3.75 3.75L11.25 11.25"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M11.25 3.75L3.75 11.25"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>
