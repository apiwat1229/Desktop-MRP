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
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner/Spinner.vue';
import { BookOpen, Upload } from 'lucide-vue-next';
import { computed, inject, onMounted, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

import KnowledgeBookCard from '@/components/knowledge-center/KnowledgeBookCard.vue';
import KnowledgeBookEdit from '@/components/knowledge-center/KnowledgeBookEdit.vue';
import KnowledgeBookUpload from '@/components/knowledge-center/KnowledgeBookUpload.vue';
import KnowledgeBookViewer from '@/components/knowledge-center/KnowledgeBookViewer.vue';
import { knowledgeBooksApi, type KnowledgeBook } from '@/services/knowledge-books';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();

// Injected State
const searchQuery = inject<Ref<string>>('helpDeskSearchQuery', ref(''));

// State
const isUploadModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isViewerModalOpen = ref(false);
const isDeleteConfirmOpen = ref(false);
const selectedBook = ref<KnowledgeBook | null>(null);
const bookToDelete = ref<KnowledgeBook | null>(null);
const books = ref<KnowledgeBook[]>([]);
const loadingBooks = ref(false);
const selectedCategory = ref<string>('');
const ebookCategories = ref<string[]>([]);
const loadingCategories = ref(false);

const isITDepartment = computed(() => {
  const userDept = authStore.user?.department;
  return userDept === 'Information Technology' || userDept === 'เทคโนโลยีสารสนเทศ (IT)';
});

const filteredBooks = computed(() => books.value);
const categories = computed(() => ebookCategories.value);

// Methods
async function loadCategories() {
  loadingCategories.value = true;
  try {
    ebookCategories.value = await knowledgeBooksApi.getCategories();
  } catch (error) {
    console.error('Failed to load categories:', error);
  } finally {
    loadingCategories.value = false;
  }
}

async function loadBooks() {
  loadingBooks.value = true;
  try {
    books.value = await knowledgeBooksApi.getAll({
      category: selectedCategory.value === 'ALL' ? undefined : selectedCategory.value || undefined,
      search: searchQuery.value || undefined,
    });
  } catch (error) {
    console.error('Failed to load books:', error);
  } finally {
    loadingBooks.value = false;
  }
}

watch(searchQuery, () => {
  loadBooks();
});

function handleViewBook(book: KnowledgeBook) {
  if (book.fileType !== 'pdf' && book.fileType !== 'pptx') {
    toast.info(t('services.itHelp.kb.pptxDirectDownload'));
    handleDownloadBook(book);
    return;
  }
  selectedBook.value = book;
  isViewerModalOpen.value = true;
}

async function handleDownloadBook(book: KnowledgeBook) {
  const link = document.createElement('a');
  link.href = knowledgeBooksApi.getDownloadUrl(book.id);
  link.download = book.fileName;
  link.click();
  const bookIndex = books.value.findIndex((b) => b.id === book.id);
  if (bookIndex !== -1) {
    books.value[bookIndex].downloads++;
  }
}

function onViewTracked(bookId: string) {
  const bookIndex = books.value.findIndex((b) => b.id === bookId);
  if (bookIndex !== -1) {
    books.value[bookIndex].views++;
  }
}

function handleEditBook(book: KnowledgeBook) {
  selectedBook.value = book;
  isEditModalOpen.value = true;
}

function handleDeleteBook(book: KnowledgeBook) {
  bookToDelete.value = book;
  isDeleteConfirmOpen.value = true;
}

async function confirmDelete() {
  if (!bookToDelete.value) return;
  try {
    await knowledgeBooksApi.delete(bookToDelete.value.id);
    await loadBooks();
    toast.success('eBook deleted successfully');
  } catch (error) {
    console.error('Failed to delete book:', error);
    toast.error('Failed to delete eBook');
  } finally {
    isDeleteConfirmOpen.value = false;
    bookToDelete.value = null;
  }
}

const handleUploadSuccess = () => loadBooks();
const onBookUpdated = () => loadBooks();

onMounted(() => {
  loadBooks();
  loadCategories();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold">{{ t('services.itHelp.kb.title') }}</h3>
        <p class="text-sm text-muted-foreground">{{ t('services.itHelp.kb.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <Select v-model="selectedCategory" @update:model-value="loadBooks">
          <SelectTrigger class="w-[180px] h-9">
            <SelectValue :placeholder="t('services.itHelp.kb.allCategories')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{{ t('services.itHelp.kb.allCategories') }}</SelectItem>
            <SelectItem v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          v-if="isITDepartment"
          size="sm"
          @click="isUploadModalOpen = true"
          class="gap-2 h-9 whitespace-nowrap bg-primary text-white hover:bg-primary/90 shadow-sm font-bold"
        >
          <Upload class="w-4 h-4" />
          {{ t('services.itHelp.kb.uploadBtn') }}
        </Button>
      </div>
    </div>

    <!-- eBook Grid -->
    <div v-if="loadingBooks" class="flex justify-center py-12">
      <Spinner class="h-8 w-8 text-primary" />
    </div>

    <div v-else-if="filteredBooks.length === 0" class="text-center py-12">
      <BookOpen class="w-12 h-12 mx-auto mb-4 opacity-20" />
      <h3 class="text-lg font-medium mb-2">{{ t('services.itHelp.kb.noBooks') }}</h3>
      <p class="text-muted-foreground mb-4">
        {{
          searchQuery || selectedCategory
            ? t('services.itHelp.kb.adjustFilters')
            : t('services.itHelp.kb.uploadFirst')
        }}
      </p>
      <Button
        v-if="isITDepartment"
        variant="outline"
        @click="isUploadModalOpen = true"
        class="gap-2"
      >
        <Upload class="w-4 h-4" />
        {{ t('services.itHelp.kb.uploadBtn') }}
      </Button>
    </div>

    <div v-else class="relative px-12">
      <Carousel
        class="w-full"
        :opts="{
          align: 'start',
          loop: true,
        }"
      >
        <CarouselContent class="-ml-4">
          <CarouselItem
            v-for="book in filteredBooks"
            :key="book.id"
            class="pl-4 md:basis-1/2 lg:basis-1/3"
          >
            <KnowledgeBookCard
              :book="book"
              :can-delete="isITDepartment"
              @view="handleViewBook(book)"
              @download="handleDownloadBook(book)"
              @delete="handleDeleteBook(book)"
              @edit="handleEditBook(book)"
            />
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious class="-left-12 h-10 w-10" />
        <CarouselNext class="-right-12 h-10 w-10" />
      </Carousel>
    </div>

    <!-- Modals -->
    <KnowledgeBookUpload v-model:open="isUploadModalOpen" @uploaded="handleUploadSuccess" />
    <KnowledgeBookViewer
      v-model:open="isViewerModalOpen"
      :book="selectedBook"
      @view-tracked="onViewTracked"
    />
    <KnowledgeBookEdit
      v-model:open="isEditModalOpen"
      :book="selectedBook"
      @updated="onBookUpdated"
    />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{
            t('common.areYouSure') || 'Are you absolutely sure?'
          }}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete
            <b>{{ bookToDelete?.title }}</b>
            and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') || 'Cancel' }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete" class="bg-red-600 hover:bg-red-700">
            {{ t('common.delete') || 'Delete' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
