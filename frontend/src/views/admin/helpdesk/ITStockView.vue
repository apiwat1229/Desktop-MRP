<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type { ColumnDef } from '@tanstack/vue-table';
import { AlertTriangle, ArrowUpDown, Edit2, Monitor, Plus } from 'lucide-vue-next';
import { computed, h, inject, onMounted, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

import BarcodePreview from '@/components/helpdesk/BarcodePreview.vue';
import ITStockForm from '@/components/helpdesk/ITStockForm.vue';
import { itAssetsApi, type ITAsset } from '@/services/it-assets';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();

// Injected State
const searchQuery = inject<Ref<string>>('helpDeskSearchQuery', ref(''));

// State
const isStockModalOpen = ref(false);
const isStockDeleteConfirmOpen = ref(false);
const loadingStock = ref(false);
const itStock = ref<ITAsset[]>([]);
const editingStockItem = ref<ITAsset | null>(null);
const stockItemToDelete = ref<ITAsset | null>(null);
const stockCategoryFilter = ref<string>('ALL');

// Computed
const isITDepartment = computed(() => {
  const userDept = authStore.user?.department;
  return userDept === 'Information Technology' || userDept === 'เทคโนโลยีสารสนเทศ (IT)';
});

const getImageUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = process.env.VITE_API_URL || 'https://app.ytrc.co.th';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (
    cleanBaseUrl.includes('app.ytrc.co.th') &&
    !cleanBaseUrl.endsWith('/api') &&
    !cleanPath.startsWith('/api')
  ) {
    return `${cleanBaseUrl}/api${cleanPath}`;
  }

  return `${cleanBaseUrl}${cleanPath}`;
};

const getStockStatus = (item: ITAsset) => {
  if (item.stock <= 0) return 'Out of Stock';
  if (item.stock <= (item.minStock || 0)) return 'Low Stock';
  return 'In Stock';
};

const filteredITStock = computed(() => {
  let filtered = itStock.value;

  if (stockCategoryFilter.value && stockCategoryFilter.value !== 'ALL') {
    filtered = filtered.filter((item) => item.category === stockCategoryFilter.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }

  return filtered;
});

const stockStats = computed(() => {
  if (!itStock.value.length) {
    return {
      totalItems: 0,
      totalStock: 0,
      lowStock: 0,
      outOfStock: 0,
      alerts: 0,
    };
  }
  const totalItems = itStock.value.length;
  const totalStock = itStock.value.reduce((acc, item) => acc + (item.stock || 0), 0);
  const lowStock = itStock.value.filter((item) => getStockStatus(item) === 'Low Stock').length;
  const outOfStock = itStock.value.filter((item) => getStockStatus(item) === 'Out of Stock').length;
  return {
    totalItems,
    totalStock,
    lowStock,
    outOfStock,
    alerts: lowStock + outOfStock,
  };
});

const stockCategories = computed(() => {
  const cats = new Set(itStock.value.map((item) => item.category).filter(Boolean));
  return Array.from(cats).sort();
});

const itAssetColumns: ColumnDef<ITAsset>[] = [
  {
    id: 'index',
    header: () => h('div', { class: 'text-center' }, 'No.'),
    cell: ({ row }) => h('div', { class: 'text-center' }, row.index + 1),
  },
  {
    accessorKey: 'name',
    header: () => h('div', t('services.itHelp.stock.deviceName')),
    cell: ({ row }) => {
      const item = row.original;
      return h(
        HoverCard,
        { openDelay: 200 },
        {
          default: () => [
            h(
              HoverCardTrigger,
              { asChild: true },
              {
                default: () =>
                  h('div', { class: 'flex flex-col cursor-help group' }, [
                    h(
                      'div',
                      { class: 'font-medium group-hover:text-primary transition-colors' },
                      item.name
                    ),
                    h('div', { class: 'text-xs text-muted-foreground' }, item.code),
                  ]),
              }
            ),
            h(
              HoverCardContent,
              { class: 'w-80 shadow-2xl' },
              {
                default: () =>
                  h('div', { class: 'space-y-3' }, [
                    item.image
                      ? h(
                          'div',
                          {
                            class:
                              'relative aspect-video rounded-md overflow-hidden bg-muted border',
                          },
                          [
                            h('img', {
                              src: getImageUrl(item.image),
                              class: 'absolute inset-0 w-full h-full object-contain',
                            }),
                          ]
                        )
                      : h(
                          'div',
                          {
                            class:
                              'aspect-video rounded-md bg-muted flex items-center justify-center border',
                          },
                          [h(Monitor, { class: 'w-8 h-8 opacity-20' })]
                        ),
                    h('div', { class: 'space-y-1' }, [
                      h('div', { class: 'text-sm font-bold' }, item.name),
                      h(
                        'div',
                        { class: 'grid grid-cols-[80px_1fr] gap-x-2 gap-y-0.5 text-[0.6875rem]' },
                        [
                          h('span', { class: 'text-muted-foreground' }, 'Device Code:'),
                          h('span', { class: 'font-mono' }, item.code),
                          h('span', { class: 'text-muted-foreground' }, 'Category:'),
                          h(
                            'span',
                            item.category
                              ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
                              : '-'
                          ),
                          h('span', { class: 'text-muted-foreground' }, 'Location:'),
                          h('span', item.location || '-'),
                        ]
                      ),
                      item.barcode
                        ? h('div', { class: 'pt-2' }, [
                            h(BarcodePreview, { value: item.barcode, height: 35, fontSize: 10 }),
                          ])
                        : null,
                    ]),
                  ]),
              }
            ),
          ],
        }
      );
    },
  },
  {
    accessorKey: 'category',
    header: () => h('div', t('services.itHelp.stock.category')),
    cell: ({ row }) => {
      const category = row.getValue('category') as string;
      return h('div', category ? category.charAt(0).toUpperCase() + category.slice(1) : '-');
    },
  },
  {
    accessorKey: 'stock',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          class: 'text-center w-full hover:bg-muted font-bold px-0 gap-2',
        },
        () => [t('services.itHelp.stock.count'), h(ArrowUpDown, { class: 'h-4 w-4' })]
      );
    },
    cell: ({ row }) => h('div', { class: 'text-center font-bold' }, row.getValue('stock')),
  },
  {
    id: 'status',
    header: () => h('div', { class: 'text-center' }, t('common.status')),
    cell: ({ row }) => {
      const item = row.original;
      const status = getStockStatus(item);
      let badgeClass = 'bg-green-100 text-green-700';
      if (status === 'Low Stock') badgeClass = 'bg-orange-100 text-orange-700';
      if (status === 'Out of Stock') badgeClass = 'bg-red-100 text-red-700';

      return h(
        'div',
        { class: 'text-center' },
        h(
          Badge,
          {
            variant: 'secondary',
            class: badgeClass,
          },
          () => status
        )
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-center' }, t('common.actions')),
    cell: ({ row }) => {
      const item = row.original;
      return h('div', { class: 'text-center flex items-center justify-center gap-1' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8',
            onClick: (e: Event) => {
              e.stopPropagation();
              handleEditStock(item);
            },
          },
          () => h(Edit2, { class: 'w-4 h-4' })
        ),
      ]);
    },
  },
];

// Methods
const loadITAssets = async () => {
  loadingStock.value = true;
  try {
    itStock.value = await itAssetsApi.getAll();
  } catch (error) {
    console.error('Failed to load IT assets:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    loadingStock.value = false;
  }
};

const handleStockSuccess = () => {
  isStockModalOpen.value = false;
  loadITAssets();
  toast.success(t('services.itHelp.stock.saveSuccess'));
};

const handleAddStock = () => {
  editingStockItem.value = null;
  isStockModalOpen.value = true;
};

const handleEditStock = (item: ITAsset) => {
  editingStockItem.value = { ...item };
  isStockModalOpen.value = true;
};

const handleDeleteStock = (item: ITAsset | null) => {
  if (!item) return;
  stockItemToDelete.value = item;
  isStockDeleteConfirmOpen.value = true;
};

const confirmDeleteStock = async () => {
  if (!stockItemToDelete.value) return;

  try {
    await itAssetsApi.delete(stockItemToDelete.value.id);
    toast.success(t('common.success'), {
      description: t('services.itHelp.stock.deleteSuccess') || 'Item deleted successfully',
    });
    loadITAssets();
  } catch (error) {
    console.error('Failed to delete stock item:', error);
    toast.error(t('common.error'), {
      description: 'Failed to delete item',
    });
  } finally {
    isStockDeleteConfirmOpen.value = false;
    stockItemToDelete.value = null;
  }
};

onMounted(() => {
  if (isITDepartment.value) {
    loadITAssets();
  }
});
</script>

<template>
  <div v-if="isITDepartment" class="space-y-4">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-muted-foreground">Inventory Overview</h3>
      </div>

      <!-- Stats Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent class="flex items-center justify-between p-3">
            <div
              class="flex-1 flex flex-col items-center justify-center border-r border-border pr-2"
            >
              <div class="text-[0.6rem] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                Total Hardware
              </div>
              <div class="text-2xl font-black text-slate-700 font-numeric">
                {{ stockStats.totalItems }}
              </div>
            </div>
            <div class="flex-1 flex flex-col items-center justify-center pl-2">
              <div class="flex items-center gap-1.5 mb-0.5">
                <Monitor class="w-3 h-3 text-blue-500" />
                <div class="text-[0.6rem] uppercase tracking-wider text-blue-500 font-bold">
                  Total Units
                </div>
              </div>
              <div class="text-2xl font-black text-slate-700 font-numeric">
                {{ stockStats.totalStock }}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="flex items-center justify-around p-3">
            <div class="flex flex-col items-center justify-center">
              <div class="text-[0.6rem] uppercase tracking-wider text-orange-500 font-bold mb-0.5">
                Low Stock
              </div>
              <div class="text-2xl font-black text-orange-600 font-numeric">
                {{ stockStats.lowStock }}
              </div>
            </div>
            <div class="w-px h-8 bg-border"></div>
            <div class="flex flex-col items-center justify-center">
              <div class="text-[0.6rem] uppercase tracking-wider text-red-500 font-bold mb-0.5">
                Out of Stock
              </div>
              <div class="text-2xl font-black text-red-600 font-numeric">
                {{ stockStats.outOfStock }}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="flex items-center justify-center p-3 relative overflow-hidden">
            <div class="relative z-10 flex flex-col items-center">
              <div class="flex items-center gap-1.5 mb-0.5">
                <AlertTriangle class="w-3 h-3 text-red-500" />
                <div class="text-[0.6rem] uppercase tracking-wider text-red-500 font-bold">
                  Stock Alerts
                </div>
              </div>
              <div class="text-2xl font-black text-red-600 font-numeric">
                {{ stockStats.alerts }}
              </div>
              <div class="text-[0.6rem] text-red-400 mt-1 font-medium">Items needing attention</div>
            </div>
            <div
              class="absolute -right-4 -bottom-4 w-16 h-16 bg-red-50 rounded-full blur-xl opacity-50"
            ></div>
          </CardContent>
        </Card>
      </div>

      <!-- Main Content Card -->
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-bold flex items-center gap-2">
                {{ t('services.itHelp.stock.title') }}
              </h3>
              <p class="text-sm text-muted-foreground">
                {{ t('services.itHelp.stock.description') }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <select
                v-model="stockCategoryFilter"
                class="h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="ALL">All Categories</option>
                <option v-for="cat in stockCategories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
              <Button @click="handleAddStock" class="gap-2 h-9 font-bold shadow-sm">
                <Plus class="w-4 h-4" />
                {{ t('services.itHelp.stock.addItem') }}
              </Button>
            </div>
          </div>

          <DataTable
            :columns="itAssetColumns"
            :data="filteredITStock"
            :loading="loadingStock"
            :search-query="searchQuery"
          />
        </CardContent>
      </Card>
    </div>

    <!-- IT Stock Dialog -->
    <Dialog v-model:open="isStockModalOpen">
      <DialogContent class="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{{
            editingStockItem
              ? t('services.itHelp.stock.editItem')
              : t('services.itHelp.stock.addItem')
          }}</DialogTitle>
          <DialogDescription>{{ t('services.itHelp.stock.subtitle') }}</DialogDescription>
        </DialogHeader>
        <ITStockForm
          :initial-data="editingStockItem"
          @success="handleStockSuccess"
          @cancel="isStockModalOpen = false"
          @delete="handleDeleteStock(editingStockItem)"
        />
      </DialogContent>
    </Dialog>

    <!-- Stock Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isStockDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('common.areYouSure') }}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <b>{{ stockItemToDelete?.name }}</b
            >? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDeleteStock" class="bg-red-600 hover:bg-red-700">
            {{ t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
  <div
    v-else
    class="flex flex-col items-center justify-center p-12 text-center text-muted-foreground"
  >
    <div class="mb-4 p-4 bg-muted/50 rounded-full">
      <Monitor class="w-12 h-12 opacity-50" />
    </div>
    <h3 class="text-xl font-bold text-foreground">Access Restricted</h3>
    <p>This section is restricted to IT Department personnel only.</p>
  </div>
</template>
