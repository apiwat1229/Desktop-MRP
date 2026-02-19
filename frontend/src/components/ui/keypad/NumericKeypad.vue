<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Delete, Eraser } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number | string;
    title?: string;
    mode?: 'decimal' | 'lot-number';
    maxLength?: number;
    prefix?: string;
  }>(),
  {
    mode: 'decimal',
    prefix: '',
  }
);

const emit = defineEmits(['update:modelValue', 'close']);

const displayValue = ref(props.modelValue?.toString() || props.prefix || '0');

watch(
  () => props.modelValue,
  (newVal) => {
    displayValue.value = newVal?.toString() || props.prefix || '0';
  }
);

const handleNumber = (num: string) => {
  if (
    props.maxLength &&
    displayValue.value.length >= props.maxLength &&
    displayValue.value !== '0'
  ) {
    return;
  }

  if (displayValue.value === '0' && num !== '.') {
    displayValue.value = num;
  } else if (props.prefix && displayValue.value === props.prefix && num !== '.') {
    displayValue.value += num;
  } else {
    // Prevent multiple decimals
    if (num === '.' && displayValue.value.includes('.')) return;
    displayValue.value += num;
  }
  updateModel();
};

const handleBackspace = () => {
  if (props.prefix && displayValue.value.length <= props.prefix.length) {
    return;
  }

  if (displayValue.value.length > 1) {
    displayValue.value = displayValue.value.slice(0, -1);
  } else {
    displayValue.value = props.prefix || '0';
  }
  updateModel();
};

const handleClear = () => {
  displayValue.value = props.prefix || '0';
  updateModel();
};

const updateModel = () => {
  if (props.mode === 'lot-number') {
    emit('update:modelValue', displayValue.value);
  } else {
    const val = parseFloat(displayValue.value);
    emit('update:modelValue', isNaN(val) ? 0 : val);
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key >= '0' && e.key <= '9') {
    handleNumber(e.key);
  } else if (e.key === '.' && props.mode === 'decimal') {
    handleNumber('.');
  } else if (e.key === '/' && props.mode === 'lot-number') {
    handleNumber('/');
  } else if (e.key === '-' && props.mode === 'lot-number') {
    handleNumber('-');
  } else if (e.key === 'Backspace') {
    handleBackspace();
  } else if (e.key === 'Delete') {
    handleClear();
  } else if (e.key === 'Enter' || e.key === 'Escape') {
    emit('close');
  }
};

const doneButtonRef = ref<any>(null);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  setTimeout(() => {
    doneButtonRef.value?.$el?.focus?.() || doneButtonRef.value?.focus?.();
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const buttons = computed(() => {
  if (props.mode === 'lot-number') {
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '/', '0', '-'];
  }
  return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];
});
</script>

<template>
  <div class="p-4 w-64 bg-white rounded-xl shadow-xl border select-none">
    <div
      v-if="title"
      class="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 px-1 text-center"
    >
      {{ title }}
    </div>

    <div
      class="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100 ring-1 ring-inset ring-slate-200/50"
    >
      <div class="text-2xl font-black text-slate-900 text-right tabular-nums truncate">
        {{ displayValue }}
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <Button
        v-for="btn in buttons"
        :key="btn"
        variant="outline"
        class="h-12 text-lg font-bold hover:bg-slate-50 active:scale-95 transition-all rounded-lg border-slate-200"
        @click="handleNumber(btn)"
      >
        {{ btn }}
      </Button>

      <Button
        variant="outline"
        class="h-12 hover:bg-slate-50 active:scale-95 transition-all rounded-lg border-slate-200 text-slate-500"
        @click="handleBackspace"
      >
        <Delete class="w-5 h-5" />
      </Button>

      <Button
        variant="ghost"
        class="h-12 text-destructive hover:bg-destructive/10 active:scale-95 transition-all rounded-lg"
        @click="handleClear"
      >
        <Eraser class="w-5 h-5" />
      </Button>

      <Button
        ref="doneButtonRef"
        :class="[
          'h-12 font-black text-sm tracking-widest uppercase bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 transition-all rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          props.mode === 'lot-number' ? 'col-span-1' : 'col-span-2',
        ]"
        @click="emit('close')"
      >
        Done
      </Button>
    </div>
  </div>
</template>
