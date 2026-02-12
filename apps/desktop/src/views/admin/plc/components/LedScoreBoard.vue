<template>
  <div class="space-y-6">
    <!-- Compact Monitoring Header -->
    <div
      class="bg-white/40 backdrop-blur-md p-3 px-5 rounded-2xl border border-black/5 shadow-sm overflow-hidden"
    >
      <div class="flex flex-wrap items-center gap-6">
        <!-- Group 2: Brightness Control (Slimmer) -->
        <div class="flex-1 min-w-[200px] bg-slate-100/50 p-2 px-4 rounded-xl border border-black/5">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 shrink-0">
              <Sun class="h-3 w-3 text-primary" />
              <span
                class="text-[9px] uppercase font-bold tracking-wider text-muted-foreground whitespace-nowrap"
                >Brightness</span
              >
            </div>
            <input
              type="range"
              :value="brightness"
              @input="(e: any) => updateBrightness(parseInt(e.target.value))"
              :max="4"
              :step="1"
              class="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span class="text-[10px] font-black text-primary min-w-[30px] text-right">
              {{ BRIGHTNESS_OPTIONS[brightness]?.label || '0%' }}
            </span>
          </div>
        </div>

        <!-- Group 3: Global Actions (Slimmer) -->
        <div class="flex items-center gap-3">
          <button
            @click="writeDb54"
            :disabled="!isConnected || isLoading"
            class="h-9 px-6 rounded-xl font-black text-[10px] uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground border border-black/5 shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <RefreshCcw v-if="isLoading" class="h-3 w-3 animate-spin" />
            <Activity v-else class="h-3 w-3" />
            <span>{{ isLoading ? 'Syncing...' : 'Update' }}</span>
          </button>
          <Button
            @click="handleReset"
            :disabled="!isConnected || isLoading"
            variant="ghost"
            size="sm"
            class="h-9 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200"
          >
            <RotateCcw class="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>
    </div>

    <!-- Pools Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
      <PoolCard
        v-for="(pool, index) in pools"
        :key="index"
        :pool-number="index + 1"
        :pool="pool"
        :brightness="brightness"
        :has-data="hasData"
        @update:color="(color) => updatePoolColor(index, color)"
        @update:text="(text) => updatePoolText(index, text)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { usePlc } from '@/composables/usePlc';
import { Activity, RefreshCcw, RotateCcw, Sun } from 'lucide-vue-next';
import PoolCard from './PoolCard.vue';

const {
  isConnected,
  brightness,
  pools,
  isLoading,
  hasData,
  writeDb54,
  updatePoolColor,
  updatePoolText,
  updateBrightness,
  resetAll,
  BRIGHTNESS_OPTIONS,
} = usePlc();

const handleReset = () => {
  if (confirm('คุณต้องการรีเซ็ตค่าทั้งหมดหรือไม่?')) {
    resetAll();
  }
};
</script>
