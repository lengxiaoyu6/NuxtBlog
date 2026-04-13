<template>
  <div v-if="pageCount > 1" class="flex items-center justify-center">
    <nav
      class="flex items-center gap-1.5 p-1.5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-800 paper-texture shadow-sm"
      aria-label="Pagination"
    >
      <!-- Prev Button -->
      <button
        type="button"
        @click="currentPageModel > 1 ? emit('page-change', currentPageModel - 1) : undefined"
        :disabled="currentPageModel === 1"
        class="p-2.5 mr-1.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 bg-transparent border-none active:scale-95 flex items-center justify-center"
        aria-label="上一页"
      >
        <ChevronLeft :size="20" />
      </button>

      <!-- Pages -->
      <template v-for="(item, index) in paginationItems" :key="index">
        <button
          v-if="item.type === 'page'"
          type="button"
          @click="item.value === currentPageModel ? undefined : emit('page-change', item.value)"
          class="relative w-10 h-10 flex items-center justify-center text-sm font-bold transition-all duration-300 group rounded-xl border-none active:scale-95"
          :class="[
            item.value === currentPageModel
              ? 'text-white bg-brand-600 shadow-lg shadow-brand-500/30 scale-105'
              : 'text-slate-400 bg-transparent hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20'
          ]"
        >
          {{ item.value }}
          <span v-if="item.value === currentPageModel" class="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
        </button>

        <!-- Ellipsis -->
        <span
          v-else-if="item.type === 'ellipsis'"
          class="relative w-10 h-10 flex items-center justify-center text-sm font-bold text-slate-400 select-none"
        >
          ...
        </span>
      </template>

      <!-- Next Button -->
      <button
        type="button"
        @click="currentPageModel < pageCount ? emit('page-change', currentPageModel + 1) : undefined"
        :disabled="currentPageModel >= pageCount"
        class="p-2.5 ml-1.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 bg-transparent border-none active:scale-95 flex items-center justify-center"
        aria-label="下一页"
      >
        <ChevronRight :size="20" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  siblingCount?: number;
}>();

const emit = defineEmits<{
  (event: 'page-change', page: number): void;
}>();

const effectiveItemsPerPage = computed(() => props.itemsPerPage ?? 10);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.totalItems / effectiveItemsPerPage.value)),
);
const siblingCount = computed(() => props.siblingCount ?? 1);

const currentPageModel = computed({
  get: () => props.currentPage,
  set: (val) => emit('page-change', val),
});

type PaginationItem = { type: 'page'; value: number } | { type: 'ellipsis' };

const paginationItems = computed<PaginationItem[]>(() => {
  const current = currentPageModel.value;
  const total = pageCount.value;
  const sibling = siblingCount.value;
  
  // Example for siblingCount = 1
  // Total pages = 10, Current = 5
  // Output: 1 ... 4 5 6 ... 10
  
  const items: PaginationItem[] = [];
  
  if (total <= 1) return items;

  // Total items to show is small enough, show all
  const maxPagesBeforeEllipsis = sibling * 2 + 3; // e.g., 5
  if (total <= maxPagesBeforeEllipsis + 2) {
    for (let i = 1; i <= total; i++) {
      items.push({ type: 'page', value: i });
    }
    return items;
  }

  const leftSiblingIndex = Math.max(current - sibling, 1);
  const rightSiblingIndex = Math.min(current + sibling, total);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * sibling;
    for (let i = 1; i <= leftItemCount; i++) {
      items.push({ type: 'page', value: i });
    }
    items.push({ type: 'ellipsis' });
    items.push({ type: 'page', value: total });
  } else if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * sibling;
    items.push({ type: 'page', value: 1 });
    items.push({ type: 'ellipsis' });
    for (let i = total - rightItemCount + 1; i <= total; i++) {
      items.push({ type: 'page', value: i });
    }
  } else if (showLeftEllipsis && showRightEllipsis) {
    items.push({ type: 'page', value: 1 });
    items.push({ type: 'ellipsis' });
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      items.push({ type: 'page', value: i });
    }
    items.push({ type: 'ellipsis' });
    items.push({ type: 'page', value: total });
  }

  return items;
});
</script>
