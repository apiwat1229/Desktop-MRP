```
<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import api from '@/services/api';
import { useThemeStore } from '@/stores/theme';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import GlobalBackground from './components/layout/GlobalBackground.vue';
import UpdateNotification from './components/UpdateNotification.vue';

useThemeStore();

const isLoading = ref(true);
const error = ref<string | null>(null);
const isRetrying = ref(false);

const checkHealth = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    await api.get('/health');
    isLoading.value = false;
  } catch (err) {
    console.error('Health check failed:', err);
    error.value =
      'Cannot connect to server. Please check your internet connection or try again later.';
    isLoading.value = false;
  }
};

const handleRetry = async () => {
  isRetrying.value = true;
  await checkHealth();
  isRetrying.value = false;
};

onMounted(() => {
  checkHealth();
});
</script>

<template>
  <GlobalBackground />
  <div class="flex flex-col h-screen text-foreground">
    <div class="flex-1 overflow-hidden relative">
      <!-- Loading & Error States -->
      <div
        v-if="isLoading || error"
        class="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 bg-background/40 backdrop-blur-sm"
      >
        <!-- Window Controls for Splash/Error Screens -->
        <div class="absolute top-0 right-0 p-2 z-50">
          <WindowControls />
        </div>

        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center p-12 rounded-3xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl transition-all duration-700 animate-in fade-in zoom-in"
        >
          <div class="relative mb-8 group">
            <div class="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
            <img
              src="/logo-dark.png"
              alt="YTRC Logo"
              class="relative h-20 w-20 object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
            />
            <div
              class="absolute -bottom-2 -right-2 h-6 w-6 bg-background rounded-full flex items-center justify-center border border-border shadow-sm"
            >
              <Loader2 class="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>

          <div class="text-center space-y-2">
            <h2 class="text-2xl font-bold tracking-tight text-foreground">YTRC CENTER</h2>
            <div class="flex items-center justify-center gap-2">
              <span class="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
              <p class="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Connecting To Server
              </p>
            </div>
          </div>

          <div class="mt-8 w-48 h-1 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary animate-[loading_2s_ease-in-out_infinite] origin-left"
            ></div>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex flex-col items-center max-w-md text-center p-10 rounded-3xl bg-background/95 backdrop-blur-xl border border-destructive/20 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500"
        >
          <div class="rounded-full bg-destructive/10 p-5 mb-6 ring-8 ring-destructive/5">
            <AlertCircle class="h-16 w-16 text-destructive" />
          </div>
          <h2 class="text-2xl font-bold mb-3">Connection Failed</h2>
          <p class="text-muted-foreground mb-8 leading-relaxed">{{ error }}</p>
          <Button
            @click="handleRetry"
            :disabled="isRetrying"
            size="lg"
            class="w-full sm:w-auto min-w-[200px] rounded-2xl shadow-xl shadow-primary/20 h-14 text-lg font-semibold"
          >
            <RefreshCw class="mr-3 h-5 w-5" :class="{ 'animate-spin': isRetrying }" />
            {{ isRetrying ? 'Retrying...' : 'Try Again' }}
          </Button>
        </div>
      </div>

      <!-- Main App Content -->
      <router-view v-else />
    </div>
  </div>

  <UpdateNotification />
  <Toaster
    position="top-center"
    :duration="5000"
    :expand="true"
    :visibleToasts="5"
    :close-button="true"
  />
</template>

<style>
/* Global Styles handled by style.css */
@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
