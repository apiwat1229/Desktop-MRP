<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer } from 'lucide-vue-next';
import { computed } from 'vue';

interface PalletItem {
  lotNo: string;
  palletNo: number;
}

interface Props {
  open: boolean;
  planDate: string;
  planNo: string;
  customer: string;
  contractNo: string;
  items: PalletItem[];
  totalWeight: number;
  palletType?: string;
  productCode?: string;
  clRatio?: number;
  ussRatio?: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:open']);

const handlePrint = () => {
  window.print();
};

const formatLot = (lot: string) => {
  if (!lot) return '';
  // If lot is like 51260501 (8 chars), turn into 512605-01
  if (lot.length === 8) {
    return lot.substring(0, 6) + '-' + lot.substring(6);
  }
  return lot;
};

const tableData = computed(() => {
  const leftCol = [];
  const rightCol = [];

  // Track last seen lot to implement "show once per group"
  let lastLot = '';

  // Pre-process all items to determine if Lot should be shown
  const processedItems = props.items.map((item) => {
    const currentLot = item.lotNo;
    const shouldShowLot = currentLot !== lastLot;
    lastLot = currentLot;
    return {
      ...item,
      displayLot: shouldShowLot ? formatLot(currentLot) : '',
    };
  });

  // Create 60 rows (30 per column)
  for (let i = 0; i < 30; i++) {
    leftCol.push(processedItems[i] || { displayLot: '', palletNo: '' });
    rightCol.push(processedItems[i + 30] || { displayLot: '', palletNo: '' });
  }

  return { leftCol, rightCol };
});

const firstGrade = computed(() => {
  return props.items.length > 0 ? props.items[0].lotNo.substring(0, 2) : '-';
});
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="max-w-[95vw] lg:max-w-[1000px] h-[95vh] p-0 overflow-hidden flex flex-col bg-slate-100 border-none shadow-2xl"
    >
      <DialogHeader
        class="p-4 pr-12 bg-white border-b flex flex-row items-center justify-between shrink-0"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"
          >
            <Printer class="w-5 h-5" />
          </div>
          <div>
            <DialogTitle class="text-lg font-black text-slate-900"
              >FG LOADING PLAN Preview</DialogTitle
            >
            <DialogDescription class="text-slate-400 text-xs font-medium"
              >FM-QAC-026 Rev.00 Document Generation</DialogDescription
            >
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            @click="handlePrint"
            class="rounded-xl font-black h-10 px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            <Printer class="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-4 flex justify-center print-container">
        <!-- A4 Document Mockup -->
        <div
          class="a4-page bg-white shadow-xl border border-slate-200 p-[10mm] text-black doc-font relative flex flex-col"
        >
          <!-- Top Section (Header + Tables) -->
          <div class="flex-none">
            <!-- Document ID Header -->
            <div class="absolute top-2 right-4 text-[9px] font-bold">
              FM-QAC-026 Rev.00 (Effective date 1 June 2011) *C
            </div>

            <!-- Main Header Table -->
            <table class="w-full border-collapse border-[1.5px] border-black text-[11px] mt-2">
              <tbody>
                <tr class="h-10">
                  <td
                    class="border-collapse border-[1.5px] border-black w-[25%] p-1.5 font-bold leading-snug"
                  >
                    Y.T.Rubber Co.,Ltd.<br />
                    <span class="font-normal text-[9.5px]"
                      >51/2 Moo1, Tha Sa Thorn<br />Phunphin, Surattanee, 84130</span
                    >
                  </td>
                  <td
                    class="border-collapse border-[1.5px] border-black w-[35%] text-center uppercase"
                  >
                    <div class="font-black text-[15px] tracking-tight">
                      FINISH GOOD LOADING PLAN
                    </div>
                    <div class="font-bold text-[11px] thai-font">แผนการจัดส่งสินค้าสำเร็จรูป</div>
                  </td>
                  <td class="border-collapse border-[1.5px] border-black w-[10%] text-center p-0">
                    <div
                      class="border-b-[1.5px] border-black h-1/2 flex items-center justify-center font-bold text-[10px]"
                    >
                      Grade
                    </div>
                    <div class="h-1/2 flex items-center justify-center font-black text-[16px]">
                      {{ props.items[0]?.lotNo.substring(0, 2) || firstGrade }}
                    </div>
                  </td>
                  <td class="border-collapse border-[1.5px] border-black p-0">
                    <table class="w-full h-full border-none">
                      <tbody>
                        <tr class="border-b-[1.5px] border-black">
                          <td
                            class="w-[35%] p-1.5 font-bold border-r-[1.5px] border-black text-[10px]"
                          >
                            Contract No.
                          </td>
                          <td class="px-2 font-black uppercase text-[11px]">
                            {{ props.contractNo }}
                          </td>
                        </tr>
                        <tr class="border-b-[1.5px] border-black">
                          <td class="p-1.5 font-bold border-r-[1.5px] border-black text-[10px]">
                            Destination
                          </td>
                          <td class="px-2 font-black uppercase text-[11px]">
                            {{ props.customer }}
                          </td>
                        </tr>
                        <tr>
                          <td class="p-1.5 font-bold border-r-[1.5px] border-black text-[10px]">
                            Revision No.
                          </td>
                          <td class="px-2 text-center font-black text-[11px]">00</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Main Data Table -->
            <div class="mt-4 flex gap-3">
              <!-- Left Half -->
              <div class="flex-1">
                <table
                  class="w-full border-collapse border-[1.5px] border-black text-[10.5px] text-center"
                >
                  <thead>
                    <tr class="h-6 bg-slate-50 font-bold overflow-hidden">
                      <td class="border-[1.5px] border-black w-[15%]">No.</td>
                      <td class="border-[1.5px] border-black">Lot</td>
                      <td class="border-[1.5px] border-black w-[20%]">Pallet#</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in tableData.leftCol" :key="idx" class="h-[21px]">
                      <td class="border-[1.5px] border-black font-semibold">{{ idx + 1 }}</td>
                      <td class="border-[1.5px] border-black font-black">{{ item.displayLot }}</td>
                      <td class="border-[1.5px] border-black font-black">
                        {{ (item as any).palletNo || '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Right Half -->
              <div class="flex-1">
                <table
                  class="w-full border-collapse border-[1.5px] border-black text-[10.5px] text-center"
                >
                  <thead>
                    <tr class="h-6 bg-slate-50 font-bold overflow-hidden">
                      <td class="border-[1.5px] border-black w-[15%]">No.</td>
                      <td class="border-[1.5px] border-black">Lot</td>
                      <td class="border-[1.5px] border-black w-[20%]">Pallet#</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in tableData.rightCol" :key="idx" class="h-[21px]">
                      <td class="border-[1.5px] border-black font-semibold">{{ idx + 31 }}</td>
                      <td class="border-[1.5px] border-black font-black">{{ item.displayLot }}</td>
                      <td class="border-[1.5px] border-black font-black">
                        {{ (item as any).palletNo || '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Bottom Section (Summary + Footer) -->
          <div class="mt-auto">
            <!-- Footer Summary Table -->
            <div class="flex border-[1.5px] border-black bg-white">
              <div class="w-[60%] border-r-[1.5px] border-black p-4 space-y-2 text-[12.5px]">
                <div class="flex items-baseline">
                  <span class="w-32 font-bold italic">Contract of</span>
                  <span class="font-black italic">: {{ props.planDate }}</span>
                </div>
                <div class="flex items-baseline">
                  <span class="w-32 font-bold italic">CL/USS Ratio</span>
                  <span class="font-black italic"
                    >: {{ props.clRatio ?? 0 }}/{{ props.ussRatio ?? 0 }}</span
                  >
                </div>
                <div class="flex items-baseline">
                  <span class="w-32 font-bold italic">Total Weight</span>
                  <span class="font-black italic">: {{ props.totalWeight }} Tons</span>
                </div>
                <div class="flex items-baseline">
                  <span class="w-32 font-bold italic leading-tight">Netweight / Pallet</span>
                  <span class="font-black italic"
                    >:
                    {{
                      props.items.length > 0
                        ? (props.totalWeight / props.items.length).toFixed(3)
                        : '0.000'
                    }}
                    Tons</span
                  >
                </div>
                <div class="pt-2"><span class="font-bold underline italic">Note</span> :</div>
              </div>
              <div class="flex-1">
                <table class="w-full h-full border-collapse">
                  <tbody>
                    <tr class="border-b-[1.5px] border-black h-1/4">
                      <td class="border-r-[1.5px] border-black w-1/3 p-2 font-bold italic">
                        Pallet :
                      </td>
                      <td class="text-center font-black text-[13px] uppercase">
                        {{ props.palletType || '-' }}
                      </td>
                    </tr>
                    <tr class="border-b-[1.5px] border-black h-1/4">
                      <td class="border-r-[1.5px] border-black p-2 font-bold italic">
                        Product Code :
                      </td>
                      <td class="text-center font-black text-[13px] uppercase">
                        {{ props.productCode || '-' }}
                      </td>
                    </tr>
                    <tr class="h-2/4">
                      <td colspan="2" class="p-0">
                        <div class="flex h-full">
                          <div
                            class="w-1/2 border-r-[1.5px] border-black flex flex-col items-center justify-between p-2 py-5"
                          >
                            <span class="text-[10px] font-bold italic">Issue by</span>
                            <div class="w-4/5 border-b border-black mt-6"></div>
                            <span class="text-[10px] mt-1 italic">Date : ____/____/____</span>
                          </div>
                          <div class="flex-1 flex flex-col items-center justify-between p-2 py-5">
                            <span class="text-[10px] font-bold italic">Approve by</span>
                            <div class="w-4/5 border-b border-black mt-6"></div>
                            <span class="text-[9.5px] mt-1 italic leading-none"
                              >(Supervisor/QA Manager)</span
                            >
                            <span class="text-[10px] italic">Date : ____/____/____</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Copyright / Footer -->
            <div class="mt-4 text-[10px] italic font-bold">
              Copy Laboratory, Warehouse, Shipping (by Electronic File ), QAC
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');

.doc-font {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
}

.a4-page {
  width: 210mm;
  height: 297mm;
  box-sizing: border-box;
}

.thai-font {
  font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
}

@media print {
  @page {
    size: A4;
    margin: 0;
  }
  body * {
    visibility: hidden;
  }
  .print-container,
  .print-container * {
    visibility: visible;
  }
  .print-container {
    position: fixed;
    left: 0;
    top: 0;
    width: 210mm;
    height: 297mm;
    padding: 0 !important;
    margin: 0 !important;
    background: white;
  }
  .a4-page {
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    width: 210mm;
    height: 297mm;
    padding: 10mm !important;
  }
  /* Hide UI elements from print */
  button,
  [role='dialog'] > button,
  .DialogHeader {
    display: none !important;
  }
}
</style>
