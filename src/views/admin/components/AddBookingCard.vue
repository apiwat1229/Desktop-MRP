<script setup lang="ts">
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

defineProps<{
  isFull?: boolean;
}>();

const emit = defineEmits(['click']);
const { t } = useI18n();
</script>

<template>
  <Card
    class="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-dashed border-slate-300 bg-card/40 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center w-full max-w-[310px] min-h-[380px] h-full cursor-pointer hover:border-primary/50 hover:bg-primary/5"
    :class="{ 'opacity-80 cursor-not-allowed grayscale-[0.5]': isFull }"
    @click="!isFull && emit('click')"
  >
    <div class="flex flex-col items-center gap-4 p-8 text-center">
      <div
        class="size-16 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-primary/20"
      >
        <Plus
          class="size-8 text-primary transition-colors"
          :class="{ 'text-muted-foreground': isFull }"
        />
      </div>
      <div class="space-y-1">
        <h3 class="text-lg font-bold tracking-tight text-foreground">
          {{ isFull ? t('bookingQueue.slotFull') : t('bookingQueue.addBooking') }}
        </h3>
        <p class="text-sm text-muted-foreground" v-if="!isFull">
          {{ t('bookingQueue.clickToBook') || 'Click to schedule a new delivery' }}
        </p>
      </div>
    </div>
  </Card>
</template>
