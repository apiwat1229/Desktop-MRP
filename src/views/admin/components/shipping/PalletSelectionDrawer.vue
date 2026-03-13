<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type AvailablePallet } from '@/services/shippingPlans';
import { computed } from 'vue';

interface Props {
  open: boolean;
  lotNo: string;
  pallets: AvailablePallet[];
  selectedIds: Set<string>;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:open', 'toggleSelection', 'toggleLot']);

const isPalletSelected = (pallet: AvailablePallet) => {
  return props.selectedIds.has(`${pallet.rowId}-${pallet.palletNo}`);
};

const isLotFullySelected = computed(() => {
  return props.pallets.every((p) => isPalletSelected(p));
});

const handleToggleLot = () => {
  emit('toggleLot', props.pallets);
};

const handleTogglePallet = (pallet: AvailablePallet) => {
  emit('toggleSelection', pallet);
};
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent class="sm:max-w-md flex flex-col p-0 bg-white overflow-hidden">
      <SheetHeader class="p-6 border-b shrink-0">
        <div>
          <SheetTitle class="text-xl font-black text-slate-900"
            >Select Pallets for Lot: <span class="text-primary">{{ lotNo }}</span></SheetTitle
          >
          <SheetDescription class="text-slate-500 font-medium">
            Choose individual pallets or select all.
          </SheetDescription>
        </div>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto">
        <Table>
          <TableHeader class="sticky top-0 bg-white z-10 shadow-sm border-b">
            <TableRow class="hover:bg-transparent">
              <TableHead class="w-12 text-center">
                <Checkbox :checked="isLotFullySelected" @update:checked="handleToggleLot" />
              </TableHead>
              <TableHead class="font-bold text-slate-400 capitalize text-xs">Pallet No</TableHead>
              <TableHead class="font-bold text-slate-400 capitalize text-xs text-center"
                >Type</TableHead
              >
              <TableHead class="font-bold text-slate-400 capitalize text-xs text-right"
                >Weight</TableHead
              >
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="pallet in pallets"
              :key="`${pallet.rowId}-${pallet.palletNo}`"
              class="cursor-pointer hover:bg-slate-50 transition-colors"
              @click="handleTogglePallet(pallet)"
            >
              <TableCell class="p-4 text-center" @click.stop>
                <Checkbox
                  :checked="isPalletSelected(pallet)"
                  @update:checked="handleTogglePallet(pallet)"
                />
              </TableCell>
              <TableCell class="font-bold text-slate-900">Pallet {{ pallet.palletNo }}</TableCell>
              <TableCell class="text-center text-xs font-semibold text-slate-500">
                {{ pallet.palletType }}
              </TableCell>
              <TableCell class="text-right tabular-nums">
                <span class="font-bold text-slate-900 mr-1">{{ pallet.weight }}</span>
                <span class="text-[10px] text-slate-400">KG</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <SheetFooter class="p-6 border-t bg-slate-50/50 shrink-0">
        <Button class="w-full rounded-xl font-black h-12" @click="emit('update:open', false)">
          Done Selecting
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
