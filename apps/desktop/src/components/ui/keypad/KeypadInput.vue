<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ref } from 'vue';
import NumericKeypad from './NumericKeypad.vue';

const props = defineProps<{
  modelValue: number | string;
  title?: string;
  placeholder?: string;
  unit?: string;
  disabled?: boolean;
  class?: string;
  buttonClass?: string;
  mode?: 'decimal' | 'lot-number';
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
</script>

<template>
  <div :class="props.class">
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :disabled="props.disabled"
          :class="[
            'w-full justify-between h-10 border-input font-bold text-slate-700 bg-white hover:bg-slate-50/50',
            props.buttonClass,
          ]"
        >
          <span>{{ props.modelValue ?? (props.placeholder || '0') }}</span>
          <span
            v-if="props.unit"
            class="text-[10px] text-muted-foreground uppercase tracking-tighter ml-2"
            >{{ props.unit }}</span
          >
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0 border-none shadow-none bg-transparent" align="start">
        <NumericKeypad
          :model-value="props.modelValue"
          @update:model-value="emit('update:modelValue', $event)"
          :title="props.title"
          :mode="props.mode"
          @close="isOpen = false"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>
