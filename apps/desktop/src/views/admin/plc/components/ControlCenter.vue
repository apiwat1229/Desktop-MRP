<script setup lang="ts">
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MarkerState } from '@/composables/usePlc';
import { ref, watch } from 'vue';

const props = defineProps<{
  markerData: MarkerState;
  dbData: number[];
  plcConnected: boolean;
  hasData: boolean;
  isProcessing?: boolean;
}>();

const emit = defineEmits<{
  (e: 'updateLineUse', bit: number, value: boolean): void;
}>();

const LINE_CONFIG = [0, 1, 2, 3];

const handleLineUseChange = (lineIndex: number, checked: boolean) => {
  emit('updateLineUse', lineIndex, checked);
};

const getLineStatus = (index: number): boolean => {
  const key = `line${index + 1}Use` as keyof MarkerState;
  return !!props.markerData[key];
};

const localValues = ref<string[]>([]);

watch(
  [() => props.dbData, () => props.hasData],
  ([newData, newHasData]) => {
    if (!newHasData) {
      localValues.value = Array(8).fill('');
    } else {
      localValues.value = newData.map((v) => String(v));
    }
  },
  { immediate: true }
);

const getValues = (): number[] => {
  return localValues.value.map((v) => parseInt(v) || 0);
};

defineExpose({ getValues });
</script>

<template>
  <Card class="border-none bg-transparent shadow-none">
    <div class="p-0 flex flex-col gap-6">
      <!-- Line Controls Grid -->
      <div class="grid grid-cols-1 gap-4">
        <div
          v-for="(_, index) in LINE_CONFIG"
          :key="index"
          class="group relative bg-white/40 backdrop-blur-sm p-5 rounded-3xl border border-black/5 transition-all hover:bg-white/60 hover:border-primary/40 overflow-hidden flex flex-col gap-4 shadow-sm"
        >
          <!-- Background Glow Effect (Softer - Pulse Only) -->
          <div
            class="absolute left-0 top-0 w-1 h-full bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity"
          ></div>

          <!-- Status & Toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-primary border border-black/10"
              >
                0{{ index + 1 }}
              </div>
              <span
                class="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover:text-foreground transition-colors"
              >
                Production Line
              </span>
            </div>
            <div
              class="flex items-center gap-3 bg-slate-100/80 p-1 rounded-full border border-black/10"
            >
              <span
                class="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-2"
              >
                {{ getLineStatus(index) ? 'ACTIVE' : 'IDLE' }}
              </span>
              <div
                @click="handleLineUseChange(index, !getLineStatus(index))"
                :class="[
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                  getLineStatus(index) ? 'bg-primary' : 'bg-slate-200',
                ]"
              >
                <span
                  :class="[
                    'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
                    getLineStatus(index) ? 'translate-x-4' : 'translate-x-0',
                  ]"
                ></span>
              </div>
            </div>
          </div>

          <!-- Inputs Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label
                class="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 ml-1"
              >
                <div class="h-1 w-1 rounded-full bg-primary/50"></div>
                Pool No.
              </Label>
              <div class="relative">
                <Input
                  v-model="localValues[index * 2]"
                  type="number"
                  :disabled="!plcConnected"
                  class="h-11 px-4 text-sm font-mono font-bold bg-slate-50/50 border-black/5 text-foreground rounded-xl focus:ring-1 focus:ring-primary/40 transition-all text-center"
                  placeholder="00"
                />
              </div>
            </div>
            <div class="space-y-2">
              <Label
                class="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 ml-1"
              >
                <div class="h-1 w-1 rounded-full bg-secondary/50"></div>
                Scoops
              </Label>
              <div class="relative">
                <Input
                  v-model="localValues[index * 2 + 1]"
                  type="number"
                  :disabled="!plcConnected"
                  class="h-11 px-4 text-sm font-mono font-bold bg-slate-50/50 border-black/5 text-foreground rounded-xl focus:ring-1 focus:ring-secondary/40 transition-all text-center"
                  placeholder="000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
