<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme';
import {
  Code2,
  Languages,
  Maximize,
  Moon,
  Palette,
  RefreshCcw,
  Search,
  Sun,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-vue-next';
import { computed } from 'vue';

const themeStore = useThemeStore();

const colors = [
  { name: 'Teal', value: 'teal', bg: 'bg-teal-500' },
  { name: 'Green', value: 'green', bg: 'bg-green-600' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-600' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-500' },
  { name: 'Rose', value: 'rose', bg: 'bg-rose-500' },
  { name: 'Violet', value: 'violet', bg: 'bg-violet-600' },
];

const fontSizes = [
  { id: 'small', name: 'Small', class: 'text-sm' },
  { id: 'medium', name: 'Medium', class: 'text-base' },
  { id: 'large', name: 'Large', class: 'text-lg' },
  { id: 'xl', name: 'XL', class: 'text-xl' },
];

// Slider Bridge
const fontSizeIndex = computed({
  get: () => fontSizes.findIndex((s) => s.id === themeStore.fontSize),
  set: (index: number) => {
    themeStore.fontSize = fontSizes[index].id;
  },
});

const fontFamilies = [
  { name: 'Bai Jamjuree', value: 'baiJamjuree', style: { fontFamily: 'Bai Jamjuree, sans-serif' } },
  { name: 'Sarabun', value: 'sarabun', style: { fontFamily: 'Sarabun, sans-serif' } },
  { name: 'Kanit', value: 'kanit', style: { fontFamily: 'Kanit, sans-serif' } },
  { name: 'Prompt', value: 'prompt', style: { fontFamily: 'Prompt, sans-serif' } },
  {
    name: 'Noto Sans Thai',
    value: 'notoSansThai',
    style: { fontFamily: 'Noto Sans Thai, sans-serif' },
  },
];

import { useI18n } from 'vue-i18n';
const { locale } = useI18n();

const changeLocale = (newLocale: string) => {
  locale.value = newLocale;
  localStorage.setItem('language', newLocale);
};

// Window/App Controls
const handleReload = () => window.ipcRenderer?.app?.reload?.();
const handleForceReload = () => window.ipcRenderer?.app?.forceReload?.();
const handleToggleDevTools = () => window.ipcRenderer?.app?.toggleDevTools?.();
const handleZoomIn = () => window.ipcRenderer?.app?.zoomIn?.();
const handleZoomOut = () => window.ipcRenderer?.app?.zoomOut?.();
const handleZoomReset = () => window.ipcRenderer?.app?.zoomReset?.();
const handleToggleFullScreen = () => window.ipcRenderer?.app?.toggleFullScreen?.();
</script>

<template>
  <div class="space-y-8">
    <!-- Row 1: Appearance & Language -->
    <div class="grid grid-cols-2 gap-6">
      <!-- Theme Mode -->
      <div class="space-y-3">
        <div class="font-semibold text-sm flex items-center gap-2 text-primary">
          <Sun class="size-4" />
          Appearance
        </div>
        <div class="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            class="h-14 flex flex-col items-center justify-center gap-1 transition-all border-muted hover:border-primary px-0"
            :class="{ 'border-primary bg-primary/5 ring-1 ring-primary': !themeStore.isDark }"
            @click="themeStore.isDark = false"
          >
            <Sun class="size-4" />
            <span class="text-[10px] font-medium">Light</span>
          </Button>
          <Button
            variant="outline"
            class="h-14 flex flex-col items-center justify-center gap-1 transition-all border-muted hover:border-primary px-0"
            :class="{ 'border-primary bg-primary/5 ring-1 ring-primary': themeStore.isDark }"
            @click="themeStore.isDark = true"
          >
            <Moon class="size-4" />
            <span class="text-[10px] font-medium">Dark</span>
          </Button>
        </div>
      </div>

      <!-- Language -->
      <div class="space-y-3">
        <div class="font-semibold text-sm flex items-center gap-2 text-primary">
          <Languages class="size-4" />
          Language
        </div>
        <div class="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            class="h-14 flex flex-col items-center justify-center gap-1 transition-all border-muted hover:border-primary px-0"
            :class="{ 'border-primary bg-primary/5 ring-1 ring-primary': locale === 'en' }"
            @click="changeLocale('en')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 60 30"
              class="w-5 h-3 rounded-sm shadow-sm ring-1 ring-black/5"
            >
              <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6" />
              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="4" />
              <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10" />
              <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6" />
            </svg>
            <span class="text-[10px] font-medium">English</span>
          </Button>
          <Button
            variant="outline"
            class="h-14 flex flex-col items-center justify-center gap-1 transition-all border-muted hover:border-primary px-0"
            :class="{ 'border-primary bg-primary/5 ring-1 ring-primary': locale === 'th' }"
            @click="changeLocale('th')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 900 600"
              class="w-5 h-3 rounded-sm shadow-sm ring-1 ring-black/5"
            >
              <rect width="900" height="600" fill="#F4F5F8" />
              <rect width="900" height="100" fill="#ED1C24" />
              <rect width="900" height="100" y="500" fill="#ED1C24" />
              <rect width="900" height="200" y="200" fill="#241D4E" />
            </svg>
            <span class="text-[10px] font-medium">ไทย</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Row 2: Theme Color -->
    <div class="space-y-3">
      <div class="font-semibold text-sm flex items-center gap-2 text-primary">
        <Palette class="size-4" />
        Theme Color
      </div>
      <div class="grid grid-cols-6 gap-3">
        <button
          v-for="color in colors"
          :key="color.value"
          @click="themeStore.themeColor = color.value"
          class="flex flex-col items-center justify-center gap-1 rounded-full border-2 p-1.5 transition-all hover:scale-105 active:scale-95"
          :class="
            themeStore.themeColor === color.value
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-transparent'
          "
          :title="color.name"
        >
          <div
            class="h-6 w-6 rounded-full shadow-inner ring-2 ring-background ring-offset-1 ring-offset-muted"
            :class="color.bg"
          />
        </button>
      </div>
    </div>

    <!-- Row 3: Typography (Combined Font Family & Size) -->
    <div class="space-y-5 p-4 rounded-xl border bg-muted/30">
      <div class="flex items-center gap-2 font-semibold text-sm text-primary">
        <Type class="size-4" />
        Typography Settings
      </div>

      <div class="grid grid-cols-5 gap-6">
        <!-- Font Family List -->
        <div class="col-span-3 space-y-2 border-r pr-4">
          <div class="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-1">
            Font Family
          </div>
          <div class="space-y-1">
            <button
              v-for="font in fontFamilies"
              :key="font.value"
              @click="themeStore.fontFamily = font.value"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left group"
              :class="
                themeStore.fontFamily === font.value
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-primary/10'
              "
            >
              <div
                class="size-2 rounded-full"
                :class="
                  themeStore.fontFamily === font.value
                    ? 'bg-primary-foreground'
                    : 'bg-muted-foreground/30'
                "
              />
              <span :style="font.style" class="text-xs">{{ font.name }}</span>
            </button>
          </div>
        </div>

        <!-- Font Size Slider -->
        <div class="col-span-2 space-y-4 flex flex-col justify-center">
          <div class="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-1">
            Font Size: {{ fontSizes[fontSizeIndex].name }}
          </div>

          <div class="px-2 space-y-6">
            <div class="relative flex items-center">
              <input
                type="range"
                min="0"
                :max="fontSizes.length - 1"
                step="1"
                v-model.number="fontSizeIndex"
                class="w-full h-1.5 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-primary slider-thumb-premium"
              />
            </div>

            <!-- Preview display -->
            <div
              class="flex items-center justify-center p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 min-h-[60px]"
            >
              <span :class="fontSizes[fontSizeIndex].class" class="text-center font-medium">
                Example Text
              </span>
            </div>

            <!-- Labels for slider ends -->
            <div class="flex justify-between items-center text-muted-foreground">
              <span class="text-[10px]">A</span>
              <span class="text-lg">A</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 4: App Controls -->
    <div class="space-y-4 pt-4 border-t border-dashed">
      <div
        class="font-sm text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2"
      >
        <Code2 class="size-4" />
        System Controls
      </div>

      <div class="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          class="flex flex-col gap-1.5 h-16 border-muted hover:border-primary transition-all hover:bg-primary/5 group"
          @click="handleReload"
        >
          <RefreshCcw class="size-4 group-hover:rotate-45 transition-transform" />
          <span class="text-[10px] font-semibold">Reload</span>
        </Button>
        <Button
          variant="outline"
          class="flex flex-col gap-1.5 h-16 border-muted hover:border-orange-500 transition-all hover:bg-orange-50 group"
          @click="handleForceReload"
        >
          <RefreshCcw class="size-4 text-orange-500 group-hover:rotate-180 transition-transform" />
          <span class="text-[10px] font-semibold">Force</span>
        </Button>
        <Button
          variant="outline"
          class="flex flex-col gap-1.5 h-16 border-muted hover:border-primary transition-all hover:bg-primary/5 group"
          @click="handleToggleDevTools"
        >
          <Code2 class="size-4 group-hover:scale-110 transition-transform" />
          <span class="text-[10px] font-semibold">DevTools</span>
        </Button>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          class="flex flex-col gap-1.5 h-16 border-muted hover:border-primary transition-all px-0"
          @click="handleZoomOut"
        >
          <ZoomOut class="size-4" />
          <span class="text-[10px] font-semibold">Zoom -</span>
        </Button>
        <Button
          variant="outline"
          class="flex flex-col gap-1.5 h-16 border-muted hover:border-primary transition-all px-0"
          @click="handleZoomReset"
        >
          <Search class="size-4" />
          <span class="text-[10px] font-semibold">Reset</span>
        </Button>
        <Button
          variant="outline"
          class="flex flex-col gap-1.5 h-16 border-muted hover:border-primary transition-all px-0"
          @click="handleZoomIn"
        >
          <ZoomIn class="size-4" />
          <span class="text-[10px] font-semibold">Zoom +</span>
        </Button>
      </div>

      <Button
        variant="outline"
        class="w-full h-12 flex items-center justify-center gap-3 border-muted hover:border-primary transition-all rounded-xl hover:bg-primary/5 group"
        @click="handleToggleFullScreen"
      >
        <Maximize class="size-4 group-hover:scale-110 transition-transform" />
        <span class="text-xs font-bold uppercase tracking-widest">Full Screen</span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.slider-thumb-premium::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: hsl(var(--primary));
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider-thumb-premium::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
}

.slider-thumb-premium::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: hsl(var(--primary));
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}
</style>
