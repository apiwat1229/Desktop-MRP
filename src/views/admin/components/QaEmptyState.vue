<script setup lang="ts">
import { FlaskConical } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  title?: string;
  description?: string;
}>();
</script>

<template>
  <div
    class="flex flex-col items-center justify-center py-16 bg-slate-50/50 border border-dashed rounded-[1.5rem] border-slate-200 w-full animate-in fade-in zoom-in duration-500"
  >
    <div class="bg-white p-6 rounded-full mb-6 shadow-sm border border-slate-100">
      <FlaskConical class="h-12 w-12 text-slate-200" stroke-width="1.5" />
    </div>
    <h3 class="text-xl font-bold text-slate-700 tracking-tight">
      {{ title || t('qa.noSummaryData') }}
    </h3>
    <p
      v-if="description !== ''"
      class="text-slate-400 text-sm max-w-sm text-center mt-2 font-medium"
    >
      {{ description || t('qa.noSummaryDesc') }}
    </p>
  </div>
</template>
