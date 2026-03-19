<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlc } from '@/composables/usePlc';
import { CircuitBoard, Cpu, Monitor, Terminal, Wifi, WifiOff } from 'lucide-vue-next';
import { ref } from 'vue';
import ControlCenter from './components/ControlCenter.vue';
import LedScoreBoard from './components/LedScoreBoard.vue';

const {
  isConnected,
  dbData,
  markerData,
  hasData,
  writeAndPulse,
  updateLineUse,
  reload,
  error,
  successMessage,
} = usePlc();

const controlCenterRef = ref<InstanceType<typeof ControlCenter> | null>(null);

const handleWriteAndPulse = () => {
  if (controlCenterRef.value) {
    const values = controlCenterRef.value.getValues();
    writeAndPulse(values);
  }
};
</script>

<template>
  <div class="p-6 w-full">
    <Tabs default-value="command-center" class="space-y-6">
      <!-- Header Section integrated with Tab Navigation -->
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <h1 class="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <CircuitBoard class="w-8 h-8 text-primary" />
            PLC SYSTEMS
          </h1>
          <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Advanced monitoring & control dashboard
          </p>
        </div>

        <TabsList class="bg-slate-100/50 p-1 rounded-2xl border border-black/5 h-12">
          <TabsTrigger
            value="command-center"
            class="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 transition-all"
          >
            <Terminal class="w-3.5 h-3.5 mr-2" />
            Command Center
          </TabsTrigger>
          <TabsTrigger
            value="led-board"
            class="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 transition-all"
          >
            <Monitor class="w-3.5 h-3.5 mr-2" />
            LED Score Board
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- Error/Success Alerts -->
      <div class="fixed bottom-6 right-6 z-[100] w-80 space-y-3">
        <Alert
          v-if="error"
          variant="destructive"
          class="bg-red-50/90 backdrop-blur-md border-red-200"
        >
          <WifiOff class="h-4 w-4" />
          <AlertDescription class="text-xs font-bold">{{ error }}</AlertDescription>
        </Alert>
        <Alert
          v-if="successMessage"
          class="bg-green-50/90 backdrop-blur-md border-green-200 text-green-700"
        >
          <Wifi class="h-4 w-4" />
          <AlertDescription class="text-xs font-bold">{{ successMessage }}</AlertDescription>
        </Alert>
      </div>

      <TabsContent value="command-center" class="m-0 border-none p-0 outline-none">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Column: Settings/Info -->
          <div class="lg:col-span-4 space-y-6">
            <Card
              class="bg-white/40 backdrop-blur-md border-black/5 rounded-3xl overflow-hidden shadow-sm"
            >
              <CardHeader class="p-6 pb-2">
                <CardTitle
                  class="text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-between gap-2 w-full"
                >
                  <div class="flex items-center gap-2">
                    <Cpu class="w-4 h-4" />
                    Scanner Properties
                  </div>

                  <!-- Integrated Badge -->
                  <div
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100/50 border border-black/5"
                  >
                    <div
                      :class="[
                        'w-1.5 h-1.5 rounded-full animate-pulse',
                        isConnected ? 'bg-green-500' : 'bg-red-500',
                      ]"
                    ></div>
                    <span class="text-[8px] font-bold text-muted-foreground">
                      {{ isConnected ? 'ONLINE' : 'OFFLINE' }}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription class="text-[10px] font-bold text-muted-foreground uppercase pt-1">
                  Input Master Configuration
                </CardDescription>
              </CardHeader>
              <div class="p-6 pt-4 space-y-4">
                <div class="p-4 rounded-2xl bg-slate-50 border border-black/5 space-y-3">
                  <div
                    class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"
                  >
                    <span class="text-muted-foreground">Target IP</span>
                    <span class="text-foreground mono">192.168.190.51</span>
                  </div>
                  <div
                    class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"
                  >
                    <span class="text-muted-foreground">Rack / Slot</span>
                    <span class="text-foreground">0 / 1</span>
                  </div>
                  <div
                    class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"
                  >
                    <span class="text-muted-foreground">DB Number</span>
                    <span class="text-foreground">DB26</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card class="bg-primary/5 border-primary/10 rounded-3xl overflow-hidden border-dashed">
              <div class="p-6 space-y-3">
                <h3 class="text-[10px] font-black uppercase tracking-widest text-primary">
                  System Notice
                </h3>
                <p class="text-[11px] leading-relaxed text-primary/70 font-medium">
                  The Input Master handles weight data synchronization from physical scales to the
                  pool management system.
                </p>
              </div>
            </Card>

            <!-- Moved Action Buttons Here -->
            <div class="flex flex-col gap-3">
              <Button
                @click="handleWriteAndPulse"
                :disabled="!isConnected"
                class="w-full h-12 text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Wifi class="w-4 h-4" />
                Update Sync
              </Button>
              <Button
                @click="reload"
                variant="outline"
                :disabled="!isConnected"
                class="w-full h-12 text-xs font-black uppercase tracking-widest border-black/5 bg-white/50 backdrop-blur-sm hover:bg-white rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Terminal class="w-4 h-4" />
                Read Data
              </Button>
            </div>
          </div>

          <!-- Right Column: Controls -->
          <div class="lg:col-span-8">
            <ControlCenter
              ref="controlCenterRef"
              :marker-data="markerData"
              :db-data="dbData"
              :plc-connected="isConnected"
              :has-data="hasData"
              @write-and-pulse="handleWriteAndPulse"
              @update-line-use="updateLineUse"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="led-board" class="m-0 border-none p-0 outline-none">
        <LedScoreBoard />
      </TabsContent>
    </Tabs>
  </div>
</template>

<style scoped>
.glass-card {
  @apply bg-white/40 backdrop-blur-md border border-black/5 shadow-sm;
}
</style>
