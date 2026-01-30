```
<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import api from '@/services/api';
import { useThemeStore } from '@/stores/theme';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import GlobalBackground from './components/layout/GlobalBackground.vue';
import UpdateNotification from './components/UpdateNotification.vue';

useThemeStore();
const router = useRouter();

const isLoading = ref(true);
const error = ref<string | null>(null);
const isRetrying = ref(false);

const checkHealth = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    // Simple health check to ensure API is reachable
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

// Back Button Handling for Android
const handleBackButton = () => {
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      CapacitorApp.exitApp();
    } else {
      router.back();
    }
  });
};

// Full Screen / Immersive Mode
const setFullScreen = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.hide();
      await StatusBar.setOverlaysWebView({ overlay: true });
    } catch (err) {
      console.error('Could not set full screen:', err);
    }
  }
};

// Swipe Back Logic
const touchStart = ref({ x: 0, y: 0 });
const SWIPE_THRESHOLD = 50; // Minimum distance for swipe
const SWIPE_EDGE_AREA = 50; // Only allow swipe starting from the left edge

const handleTouchStart = (e: TouchEvent) => {
  touchStart.value = {
    x: e.changedTouches[0].screenX,
    y: e.changedTouches[0].screenY,
  };
};

const handleTouchEnd = (e: TouchEvent) => {
  const touchEnd = {
    x: e.changedTouches[0].screenX,
    y: e.changedTouches[0].screenY,
  };

  // Check if swipe started from the left edge
  if (touchStart.value.x > SWIPE_EDGE_AREA) return;

  const deltaX = touchEnd.x - touchStart.value.x;
  const deltaY = Math.abs(touchEnd.y - touchStart.value.y);

  // Check for horizontal swipe (right direction)
  if (deltaX > SWIPE_THRESHOLD && deltaY < SWIPE_THRESHOLD) {
    router.back();
  }
};

onMounted(() => {
  checkHealth();

  if (Capacitor.isNativePlatform()) {
    handleBackButton();
    setFullScreen();

    // Add Swipe Listeners
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
  }
});

onUnmounted(() => {
  if (Capacitor.isNativePlatform()) {
    CapacitorApp.removeAllListeners();
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchend', handleTouchEnd);
  }
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
