<template>
  <div class="space-y-6 sm:space-y-8 pb-16 sm:pb-20">
    <!-- Header Area -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl py-6 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b border-slate-200/50 dark:border-slate-800/50 mb-8 shadow-sm">
      <div class="flex items-center gap-4">
        <NuxtLink to="/admin/posts" class="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm text-slate-500 hover:text-slate-900 dark:hover:text-white hover:scale-105 active:scale-95">
          <ArrowLeft :size="20" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white font-serif tracking-tight">{{ isEditMode ? '编辑文章' : '撰写新文章' }}</h1>
          <div class="flex items-center gap-2 mt-1">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
            <p class="text-slate-400 dark:text-slate-500 text-xs font-medium">{{ loadingEditingPost ? '正在加载文章详情...' : '草稿已于 14:23 自动保存' }}</p>
          </div>
        </div>
      </div>

      <div class="flex w-full sm:w-auto items-center gap-2 sm:gap-3">
        <button type="button" :disabled="submitting || loadingEditingPost || !canSubmitPost" class="flex-1 sm:flex-none px-4 sm:px-6 h-10 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60" @click="submitPost('draft')">
          存为草稿
        </button>
        <button type="button" :disabled="submitting || loadingEditingPost || !canSubmitPost" class="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 sm:px-6 h-10 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-[0_4px_12px_rgba(var(--color-brand-500),0.25)] hover:shadow-[0_6px_16px_rgba(var(--color-brand-500),0.35)] transition-all active:scale-95 group disabled:cursor-not-allowed disabled:opacity-60" @click="submitPost('published')">
          <Send :size="16" class="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          立即发布
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div :inert="loadingEditingPost" :aria-busy="loadingEditingPost" :class="loadingEditingPost ? 'pointer-events-none opacity-70' : ''" class="grid grid-cols-1 gap-6 max-w-[1600px] mx-auto lg:grid-cols-2 xl:grid-cols-[17.5rem_minmax(0,1fr)_17.5rem] 2xl:grid-cols-[20rem_minmax(0,1fr)_20rem] xl:items-stretch xl:relative xl:right-4 2xl:gap-8">
      
      <!-- Cover Image Column (Right - 1/4 width) -->
      <div class="w-full space-y-6 shrink-0 order-3 lg:col-span-1 xl:order-3 xl:self-stretch xl:flex xl:flex-col">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 sm:p-7 space-y-5 shrink-0">
          <div class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <ImageIcon :size="18" class="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
              封面图片
            </h3>
          </div>
          
          <div class="relative w-full aspect-square sm:min-h-[18rem] sm:aspect-video lg:aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center overflow-hidden group hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all cursor-pointer" @click="openCoverImagePicker">
            <template v-if="post.cover">
              <img :src="post.cover" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button type="button" class="px-5 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl shadow-xl hover:scale-105 transition-transform" @click.stop="openCoverImagePicker">更换封面</button>
              </div>
            </template>
            <template v-else>
              <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-all">
                <UploadCloud :size="28" class="text-slate-400 group-hover:text-brand-500 transition-colors" />
              </div>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-200 text-center">点击或拖拽上传封面</p>
              <p class="text-[11px] font-medium text-slate-400 mt-2 text-center px-4">建议尺寸 1200×630px<br/>仅接受真实 JPG、PNG、WEBP、GIF、BMP、AVIF 图片二进制，最大 10MB</p>
            </template>
          </div>

        </div>

        <!-- Excerpt -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 sm:p-7 space-y-5 xl:flex-1 xl:min-h-0 xl:flex xl:flex-col">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <FileText :size="18" class="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                文章摘要
              </h3>
            </div>
            <span class="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">{{ post.excerpt.length }}/150</span>
          </div>
          
          <textarea
            v-model="post.excerpt"
            :disabled="loadingEditingPost"
            rows="4"
            maxlength="150"
            placeholder="简短的一段话描述文章核心内容，将展示在文章列表页及搜索引擎结果中..."
            class="w-full p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm text-slate-700 dark:text-slate-300 resize-none leading-relaxed xl:flex-1 xl:min-h-0"
          ></textarea>
        </div>
      </div>

      <!-- Title Column (Middle - Flexible width) -->
      <div class="flex-1 space-y-6 order-1 min-w-0 lg:col-span-2 xl:col-span-1 xl:col-start-2 xl:order-2">
        <!-- Title Input -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden transition-shadow focus-within:shadow-md focus-within:border-brand-500/50">
          <input
            v-model="post.title"
            :disabled="loadingEditingPost"
            type="text"
            placeholder="输入文章标题..."
            class="w-full px-5 sm:px-8 py-4 sm:py-6 bg-transparent outline-none text-2xl sm:text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 font-serif transition-all"
          />
        </div>

        <!-- Content Editor -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 sm:p-7 space-y-4">
          <div class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div class="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <FileText :size="18" class="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
              文章正文
            </h3>
          </div>

          <UEditor
            ref="editorRef"
            v-slot="{ editor }"
            v-model="post.contentMarkdown"
            content-type="markdown"
            placeholder="在此输入正文内容，支持 Markdown 与可视化排版..."
            class="editor-content w-full rounded-2xl border border-slate-200 dark:border-slate-700"
            :ui="editorUi"
            :extensions="editorExtensions"
            :handlers="editorCustomHandlers"
            :image="false"
          >
            <UEditorToolbar
              :editor="editor"
              :items="editorToolbarItems"
              class="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-t-2xl border-b border-slate-200 dark:border-slate-700 p-2"
            />
            <UEditorToolbar
              :editor="editor"
              :items="imageResizeToolbarItems"
              layout="bubble"
              :should-show="shouldShowImageResizeToolbar"
              class="rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900/95"
            />
          </UEditor>
        </div>
      </div>

      <!-- Settings Column (Left - 1/4 width) -->
      <div class="w-full space-y-6 shrink-0 order-2 lg:col-span-1 xl:order-1">
        <!-- Publish Settings -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 sm:p-7 space-y-6">
          <div class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div class="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
              <Settings2 :size="18" class="text-brand-600 dark:text-brand-400" />
            </div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
              发布设置
            </h3>
          </div>
          
          <div class="space-y-5">
            <!-- URL Slug -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-500 flex items-center justify-between">
                URL 别名（可选）
                <span class="font-normal text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">.html</span>
              </label>
              <div class="relative group">
                <Link :size="14" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  v-model="post.slug"
                  :disabled="loadingEditingPost"
                  type="text"
                  placeholder="custom-url-slug"
                  class="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-mono text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>

            <!-- Category -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-500">分类目录</label>

              <div
                class="relative flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800"
                :class="post.category ? 'border-brand-200 dark:border-brand-800/70' : ''"
              >
                <USelectMenu
                  v-model="post.category"
                  :disabled="loadingEditingPost"
                  :items="categories"
                  placeholder="选择一个分类..."
                  icon="i-lucide-layers-3"
                  trailing-icon="i-lucide-chevron-down"
                  color="neutral"
                  variant="ghost"
                  :ui="{
                    base: '!shadow-none ring-0 focus:bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:shadow-none focus-visible:outline-none',
                  }"
                  class="w-full rounded-lg"
                >
                  <template #item="{ item }">
                    <div
                      class="w-full flex items-center justify-between gap-3 rounded-lg px-1.5 py-1 transition-colors"
                      :class="item === post.category ? 'bg-slate-100 dark:bg-slate-800' : ''"
                    >
                      <span class="flex items-center gap-2 min-w-0">
                        <span
                          class="w-1.5 h-1.5 rounded-full"
                          :class="item === post.category ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'"
                        />
                        <span
                          class="truncate font-medium"
                          :class="item === post.category ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'"
                        >
                          {{ item }}
                        </span>
                      </span>
                      <Check
                        v-if="item === post.category"
                        :size="14"
                        class="text-brand-600 dark:text-brand-300 shrink-0"
                      />
                    </div>
                  </template>
                </USelectMenu>
              </div>
            </div>

            <!-- Tags -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-500 flex justify-between items-center">
                内容标签
                <span class="font-normal text-[10px] text-slate-400">{{ post.tags.length }}/5</span>
              </label>
              <div class="p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[48px] flex flex-wrap gap-2 items-center focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all cursor-text" @click="tagInputRef?.focus()">
                <TransitionGroup name="list">
                  <span v-for="(tag, index) in post.tags" :key="tag" class="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-600">
                    <span class="text-brand-500 font-normal">#</span>{{ tag }}
                    <button :disabled="loadingEditingPost" @click.stop="removeTag(index)" class="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40"><X :size="12" /></button>
                  </span>
                </TransitionGroup>
                <input
                  ref="tagInputRef"
                  v-model="tagInput"
                  :disabled="loadingEditingPost"
                  @keydown.enter.prevent="addTag"
                  type="text"
                  placeholder="输入标签后回车..."
                  class="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm px-2 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                />
              </div>

              <div class="pt-1 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">历史标签</span>
                  <span class="text-[10px] text-slate-400">{{ displayedTagHistory.length }} 个</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="historyTag in displayedTagHistory"
                    :key="historyTag"
                    type="button"
                    :disabled="loadingEditingPost || (post.tags.length >= 5 && !post.tags.includes(historyTag))"
                    @click="addHistoryTag(historyTag)"
                    class="px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :class="post.tags.includes(historyTag)
                      ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-800/70'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-200 hover:text-brand-600 dark:hover:border-brand-800/70 dark:hover:text-brand-300'"
                  >
                    #{{ historyTag }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminPostDetail } from '~/types/post';
import type { AdminPostUpsertInput, BlogPostStatus } from '~~/shared/types/post';
import type { Editor } from '@tiptap/vue-3';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import type { EditorCustomHandlers } from '@nuxt/ui';
import type { EditorToolbarItem } from '@nuxt/ui';
import { NodeSelection } from '@tiptap/pm/state';
import {
  ArrowLeft,
  Send,
  Settings2,
  X, 
  Check,
  Image as ImageIcon,
  UploadCloud,
  FileText,
  Link
} from 'lucide-vue-next';
import { uploadAssets } from '~/services/admin-media';
import { listPostCategories } from '~/services/admin-post-category';
import { adminPostEditorToolbarItems } from '~/constants/admin-post-editor-toolbar';
import type { AdminPostCategoryItem } from '~/types/admin-post-category';

definePageMeta({
  layout: 'admin',
});

const { addToast } = useAppToast();
const route = useRoute();
const router = useRouter();
const editingPostId = computed(() => typeof route.query.id === 'string' ? route.query.id : '')
const isEditMode = computed(() => Boolean(editingPostId.value))
const submitting = ref(false)

const categories = ref<string[]>([]);
const loadingEditingPost = ref(Boolean(editingPostId.value));
const maxImageSize = 10 * 1024 * 1024;
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif'];
const imagePickerAcceptValue = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif';
const maxAttachmentSize = 10 * 1024 * 1024;
const allowedAttachmentExtensions = ['pdf', 'docx', 'zip'];
const attachmentPickerAcceptValue = 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,.pdf,.docx,.zip';
const postAssetFolderId = 'post-assets';
const pendingMediaUploadCount = ref(0);

type EditorRefInstance = {
  editor?: Editor;
};

type PostFormState = {
  title: string;
  slug: string;
  contentMarkdown: string;
  category: string;
  tags: string[];
  cover: string;
  excerpt: string;
  isPinned: boolean;
};

function createEmptyPostState(): PostFormState {
  return {
    title: '',
    slug: '',
    contentMarkdown: '',
    category: '',
    tags: [],
    cover: '',
    excerpt: '',
    isPinned: false,
  };
}

const post = ref(createEmptyPostState());
const editorRef = ref<EditorRefInstance | null>(null);

const defaultTagHistory = ['Nuxt', 'Vue', 'TypeScript', 'Tailwind', '性能优化', '工程化', '设计系统'];
const tagHistoryStorageKey = 'admin.post.tag-history';
const tagHistory = ref<string[]>([...defaultTagHistory]);

const tagInput = ref('');
const tagInputRef = ref<HTMLInputElement | null>(null);
const canSubmitPost = computed(() => Boolean(
  post.value.title.trim()
  && post.value.category.trim()
  && post.value.excerpt.trim()
));
const displayedTagHistory = computed(() => {
  const deduped = Array.from(new Set(tagHistory.value.map((tag) => tag.trim()).filter(Boolean)));
  return deduped.slice(0, 14);
});

const imageExtension = Image.extend({
  renderMarkdown: (node) => {
    const src = typeof node.attrs?.src === 'string' ? node.attrs.src.trim() : '';
    const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : '';
    const title = typeof node.attrs?.title === 'string' ? node.attrs.title : '';
    const width = normalizeImageDimension(node.attrs?.width);
    const height = normalizeImageDimension(node.attrs?.height);

    if (!src) {
      return '';
    }

    if (!width && !height) {
      const escapedAlt = escapeMarkdownImageText(alt);
      const escapedTitle = escapeMarkdownImageText(title);
      return escapedTitle
        ? `![${escapedAlt}](${src} "${escapedTitle}")`
        : `![${escapedAlt}](${src})`;
    }

    const imageAttributes = [
      `src="${escapeHtmlAttribute(src)}"`,
      alt ? `alt="${escapeHtmlAttribute(alt)}"` : '',
      title ? `title="${escapeHtmlAttribute(title)}"` : '',
      width ? `width="${width}"` : '',
      height ? `height="${height}"` : ''
    ].filter(Boolean).join(' ');

    return `<img ${imageAttributes}>`;
  }
});

type ImageResizeToolbarItem = {
  kind: 'imageResizePreset';
  percent?: 25 | 50 | 75 | 100;
  action?: 'auto';
  icon?: string;
  label?: string;
  tooltip?: {
    text: string;
  };
};

const inlineImageUploadHandler = {
  canExecute: (editor: Editor) => editor.isEditable,
  execute: (editor: Editor) => {
    void handleInlineImageUpload(editor);
    return editor.chain().focus();
  },
  isActive: () => false,
  isDisabled: () => loadingEditingPost.value || pendingMediaUploadCount.value > 0
};

const attachmentUploadHandler = {
  canExecute: (editor: Editor) => editor.isEditable,
  execute: (editor: Editor) => {
    void handleAttachmentUpload(editor);
    return editor.chain().focus();
  },
  isActive: () => false,
  isDisabled: () => loadingEditingPost.value || pendingMediaUploadCount.value > 0
};

const imageResizePresetHandler = {
  canExecute: (editor: Editor) => editor.isEditable && Boolean(readSelectedImageState(editor)),
  execute: (editor: Editor, item?: ImageResizeToolbarItem) => {
    const selectedImageState = readSelectedImageState(editor);
    if (!selectedImageState) {
      return editor.chain().focus();
    }

    if (item?.action === 'auto') {
      return editor.chain().focus().updateAttributes('image', {
        width: null,
        height: null
      });
    }

    if (!item?.percent) {
      return editor.chain().focus();
    }

    const resizedImageDimensions = buildImageResizeDimensions(selectedImageState, item.percent);
    if (!resizedImageDimensions) {
      return editor.chain().focus();
    }

    return editor.chain().focus().updateAttributes('image', {
      width: resizedImageDimensions.width,
      height: resizedImageDimensions.height
    });
  },
  isActive: (editor: Editor, item?: ImageResizeToolbarItem) => {
    const selectedImageState = readSelectedImageState(editor);
    if (!selectedImageState) {
      return false;
    }

    if (item?.action === 'auto') {
      return !selectedImageState.width && !selectedImageState.height;
    }

    if (!item?.percent) {
      return false;
    }

    const resizedImageDimensions = buildImageResizeDimensions(selectedImageState, item.percent);
    if (!resizedImageDimensions) {
      return false;
    }

    return selectedImageState.width === resizedImageDimensions.width
      && selectedImageState.height === resizedImageDimensions.height;
  },
  isDisabled: (editor: Editor) => (
    loadingEditingPost.value
    || pendingMediaUploadCount.value > 0
    || !editor.isEditable
    || !readSelectedImageState(editor)
  )
};

const editorCustomHandlers = {
  inlineImageUpload: inlineImageUploadHandler,
  attachmentUpload: attachmentUploadHandler,
  imageResizePreset: imageResizePresetHandler
} satisfies EditorCustomHandlers;

const markdownContentType = 'markdown' as const;
const imageResizeToolbarItems = [
  { kind: 'imageResizePreset', percent: 25, icon: 'i-lucide-scan-line', label: '25%', tooltip: { text: '缩放到 25%' } },
  { kind: 'imageResizePreset', percent: 50, icon: 'i-lucide-scan', label: '50%', tooltip: { text: '缩放到 50%' } },
  { kind: 'imageResizePreset', percent: 75, icon: 'i-lucide-expand', label: '75%', tooltip: { text: '缩放到 75%' } },
  { kind: 'imageResizePreset', percent: 100, icon: 'i-lucide-maximize', label: '100%', tooltip: { text: '恢复原始尺寸' } },
  { kind: 'imageResizePreset', action: 'auto', icon: 'i-lucide-image-up', label: '自适应', tooltip: { text: '清除固定尺寸' } }
] as (EditorToolbarItem<typeof editorCustomHandlers> & ImageResizeToolbarItem)[];
const textAlignExtension = TextAlign.configure({ types: ['heading', 'paragraph'] });
const editorExtensions = [imageExtension, textAlignExtension];
const editorToolbarItems = adminPostEditorToolbarItems;
const editorUi = {
  root: 'flex h-[420px] sm:h-[560px] flex-col overflow-hidden',
  content: 'flex-1 overflow-auto',
  base: 'min-h-full [&_p]:!my-2.5 [&_:is(ul,ol,blockquote)]:!my-3 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl'
};

const shouldShowImageResizeToolbar = ({ view, state }: { view: { hasFocus: () => boolean }; state: { selection: unknown } }) => {
  return view.hasFocus()
    && state.selection instanceof NodeSelection
    && state.selection.node.type.name === 'image';
};

function getRequestErrorMessage(error: unknown, fallbackMessage: string) {
  const requestError = error as {
    data?: {
      statusMessage?: string;
      message?: string;
    };
    statusMessage?: string;
    message?: string;
  };

  return (
    requestError.data?.statusMessage ||
    requestError.data?.message ||
    requestError.statusMessage ||
    requestError.message ||
    fallbackMessage
  );
}

function clonePostState(source: PostFormState): PostFormState {
  return {
    ...source,
    tags: [...source.tags]
  };
}

function arePostFieldValuesEqual(left: PostFormState[keyof PostFormState], right: PostFormState[keyof PostFormState]) {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => item === right[index]);
  }

  return left === right;
}

function assignPostState(nextState: PostFormState) {
  post.value.title = nextState.title;
  post.value.slug = nextState.slug;
  post.value.contentMarkdown = nextState.contentMarkdown;
  post.value.category = nextState.category;
  post.value.tags = [...nextState.tags];
  post.value.cover = nextState.cover;
  post.value.excerpt = nextState.excerpt;
  post.value.isPinned = nextState.isPinned;
}

function createPostStateFromDetail(detail: AdminPostDetail): PostFormState {
  return {
    title: detail.title,
    slug: detail.slug ?? '',
    contentMarkdown: detail.contentMarkdown,
    category: detail.category,
    tags: [...detail.tags],
    cover: detail.coverImageUrl ?? '',
    excerpt: detail.excerpt,
    isPinned: detail.isPinned,
  };
}

function readEditorMarkdown() {
  const editor = editorRef.value?.editor;
  if (!editor) {
    return post.value.contentMarkdown;
  }

  try {
    return editor.getMarkdown();
  } catch {
    return post.value.contentMarkdown;
  }
}

function syncMountedEditorContent(contentMarkdown: string) {
  const editor = editorRef.value?.editor;
  if (!editor) {
    return;
  }

  const currentMarkdown = readEditorMarkdown();
  if (currentMarkdown !== contentMarkdown) {
    editor.commands.setContent(contentMarkdown, { contentType: markdownContentType });
  }
}

function applyAdminPostDetail(detail: AdminPostDetail, loadStartValue?: PostFormState) {
  const nextState = createPostStateFromDetail(detail);

  if (!loadStartValue) {
    assignPostState(nextState);
    syncMountedEditorContent(nextState.contentMarkdown);
    return;
  }

  if (arePostFieldValuesEqual(post.value.title, loadStartValue.title)) {
    post.value.title = nextState.title;
  }

  if (arePostFieldValuesEqual(post.value.slug, loadStartValue.slug)) {
    post.value.slug = nextState.slug;
  }

  if (arePostFieldValuesEqual(post.value.contentMarkdown, loadStartValue.contentMarkdown)) {
    post.value.contentMarkdown = nextState.contentMarkdown;
    syncMountedEditorContent(nextState.contentMarkdown);
  }

  if (arePostFieldValuesEqual(post.value.category, loadStartValue.category)) {
    post.value.category = nextState.category;
  }

  if (arePostFieldValuesEqual(post.value.tags, loadStartValue.tags)) {
    post.value.tags = [...nextState.tags];
  }

  if (arePostFieldValuesEqual(post.value.cover, loadStartValue.cover)) {
    post.value.cover = nextState.cover;
  }

  if (arePostFieldValuesEqual(post.value.excerpt, loadStartValue.excerpt)) {
    post.value.excerpt = nextState.excerpt;
  }

  if (arePostFieldValuesEqual(post.value.isPinned, loadStartValue.isPinned)) {
    post.value.isPinned = nextState.isPinned;
  }
}

function buildSubmitPayload(status: BlogPostStatus): AdminPostUpsertInput {
  return {
    title: post.value.title.trim(),
    slug: post.value.slug.trim() || undefined,
    contentMarkdown: post.value.contentMarkdown.trim(),
    category: post.value.category.trim(),
    tags: post.value.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
    coverImageUrl: post.value.cover.trim(),
    excerpt: post.value.excerpt.trim(),
    status,
    isPinned: post.value.isPinned
  };
}

async function syncEditorContentBeforeSubmit() {
  const editor = editorRef.value?.editor;
  if (!editor) {
    return;
  }

  if (editor.view.dom instanceof HTMLElement) {
    editor.view.dom.blur();
  }

  await nextTick();

  if (import.meta.client) {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }

  post.value.contentMarkdown = readEditorMarkdown();
}

async function loadEditingPost() {
  if (!editingPostId.value) {
    return;
  }

  loadingEditingPost.value = true;
  const loadStartValue = clonePostState(post.value);

  try {
    const detail = await $fetch<AdminPostDetail>(`/api/admin/posts/${editingPostId.value}`)
    applyAdminPostDetail(detail, loadStartValue);
  } catch (error) {
    addToast(getRequestErrorMessage(error, '文章加载失败'), 'error');
  } finally {
    loadingEditingPost.value = false;
  }
}

async function loadPostCategories() {
  try {
    const categoryItems = await listPostCategories();
    categories.value = categoryItems.map((item: AdminPostCategoryItem) => item.name);
    if (!post.value.category.trim() && categories.value.length > 0) {
      post.value.category = categories.value[0] || '';
    }
  } catch (error) {
    addToast(getRequestErrorMessage(error, '分类列表加载失败'), 'error');
  }
}

async function submitPost(status: BlogPostStatus) {
  if (loadingEditingPost.value) {
    return;
  }

  if (submitting.value) {
    return;
  }

  await syncEditorContentBeforeSubmit();

  if (!canSubmitPost.value) {
    addToast('请先完善文章标题、分类与摘要', 'warning');
    return;
  }

  if (status === 'published' && !post.value.contentMarkdown.trim()) {
    addToast('发布前请先填写正文内容', 'warning');
    return;
  }

  if (pendingMediaUploadCount.value > 0) {
    addToast('请先等待上传完成', 'warning');
    return;
  }

  submitting.value = true;
  const isCreatingPost = !editingPostId.value;
  const submitFeedback = status === 'draft'
    ? { status: 'draft', message: isCreatingPost ? '草稿已创建' : '草稿已保存' }
    : { status: 'published', message: isCreatingPost ? '文章已创建并发布' : '文章已发布' };

  try {
    const savedPost = await $fetch<AdminPostDetail>(editingPostId.value ? `/api/admin/posts/${editingPostId.value}` : '/api/admin/posts', {
      method: editingPostId.value ? 'PATCH' : 'POST',
      body: buildSubmitPayload(status)
    });

    applyAdminPostDetail(savedPost);

    if (isCreatingPost) {
      await router.replace({
        path: '/admin/posts/new',
        query: { id: savedPost.id }
      });
    }

    addToast(submitFeedback.message, 'success');
  } catch (error) {
    addToast(getRequestErrorMessage(error, '文章保存失败'), 'error');
  } finally {
    submitting.value = false;
  }
}

function openCoverImagePicker() {
  void pickSingleFileFromSystem(imagePickerAcceptValue).then(async (file) => {
    if (!file) {
      return;
    }

    await handleCoverImageFile(file);
  });
}
async function pickSingleFileFromSystem(accept: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  return await new Promise<File | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    const cleanup = () => {
      input.removeEventListener('change', handleChange);
      window.removeEventListener('focus', handleWindowFocus);
      input.remove();
    };

    const handleChange = () => {
      const selectedFile = input.files?.[0] ?? null;
      cleanup();
      resolve(selectedFile);
    };

    const handleWindowFocus = () => {
      window.setTimeout(() => {
        if (!input.files?.length) {
          cleanup();
          resolve(null);
        }
      }, 300);
    };

    input.addEventListener('change', handleChange, { once: true });
    window.addEventListener('focus', handleWindowFocus, { once: true });
    input.click();
  });
}

function validateImageFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (file.size > maxImageSize) {
    return '图片大小不能超过 10 MB';
  }

  if (!allowedImageExtensions.includes(extension)) {
    return '当前图片格式暂不支持，请选择真实图片二进制文件';
  }

  return '';
}

function validateAttachmentFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (file.size > maxAttachmentSize) {
    return '附件大小不能超过 10 MB';
  }

  if (!allowedAttachmentExtensions.includes(extension)) {
    return '附件仅支持真实 PDF、DOCX、ZIP 文档';
  }

  return '';
}

function createPublicMediaFileUrl(assetId: string) {
  return `/api/media/files/${encodeURIComponent(assetId)}`;
}

function normalizeImageDimension(value: unknown) {
  const parsedValue = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeMarkdownImageText(value: string) {
  return value.replace(/[[\]\\"]/g, '\\$&');
}

function readSelectedImageState(editor: Editor) {
  const { selection } = editor.state;
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') {
    return null;
  }

  const imageNode = selection.node;
  const width = normalizeImageDimension(imageNode.attrs.width);
  const height = normalizeImageDimension(imageNode.attrs.height);
  const imageElement = import.meta.client
    ? editor.view.nodeDOM(selection.from) as HTMLImageElement | null
    : null;
  const naturalWidth = normalizeImageDimension(imageElement?.naturalWidth);
  const naturalHeight = normalizeImageDimension(imageElement?.naturalHeight);
  const renderedWidth = normalizeImageDimension(imageElement?.width ?? imageElement?.clientWidth);
  const renderedHeight = normalizeImageDimension(imageElement?.height ?? imageElement?.clientHeight);

  return {
    width,
    height,
    naturalWidth,
    naturalHeight,
    renderedWidth,
    renderedHeight
  };
}

function buildImageResizeDimensions(
  selectedImageState: NonNullable<ReturnType<typeof readSelectedImageState>>,
  percent: 25 | 50 | 75 | 100
) {
  const sourceWidth = selectedImageState.naturalWidth ?? selectedImageState.width ?? selectedImageState.renderedWidth;
  const sourceHeight = selectedImageState.naturalHeight ?? selectedImageState.height ?? selectedImageState.renderedHeight;

  if (!sourceWidth || !sourceHeight) {
    return null;
  }

  return {
    width: Math.max(1, Math.round(sourceWidth * percent / 100)),
    height: Math.max(1, Math.round(sourceHeight * percent / 100))
  };
}

function normalizeAttachmentLabel(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').trim() || '下载附件';
}

function escapeMarkdownLabel(label: string) {
  return label.replace(/[[\]\\]/g, '\\$&');
}

function insertInlineImage(editor: Editor, assetId: string, altText: string) {
  const normalizedAltText = normalizeAttachmentLabel(altText);
  editor.chain().focus().setImage({
    src: createPublicMediaFileUrl(assetId),
    alt: normalizedAltText
  }).run();
}

function insertAttachmentLink(editor: Editor, assetId: string, fileName: string) {
  const label = escapeMarkdownLabel(normalizeAttachmentLabel(fileName));
  editor.chain().focus().insertContent(`\n[${label}](${createPublicMediaFileUrl(assetId)})\n`).run();
}

async function uploadPostMediaAsset(file: File) {
  pendingMediaUploadCount.value += 1;
  try {
    const uploadedAssets = await uploadAssets([file], postAssetFolderId);
    const uploadedAsset = uploadedAssets[0];
    if (!uploadedAsset) {
      throw new Error('资源上传失败');
    }

    return uploadedAsset;
  } finally {
    pendingMediaUploadCount.value = Math.max(0, pendingMediaUploadCount.value - 1);
  }
}

async function handleCoverImageFile(file: File) {
  const errorMessage = validateImageFile(file);
  if (errorMessage) {
    addToast(errorMessage, 'error');
    return;
  }

  try {
    const uploadedAsset = await uploadPostMediaAsset(file);
    post.value.cover = createPublicMediaFileUrl(uploadedAsset.id);
    addToast('封面图片已上传', 'success');
  } catch (error) {
    addToast(getRequestErrorMessage(error, '封面图片上传失败'), 'error');
  }
}

async function handleInlineImageUpload(editor: Editor) {
  if (loadingEditingPost.value) {
    return;
  }

  const file = await pickSingleFileFromSystem(imagePickerAcceptValue);
  if (!file) {
    return;
  }

  const errorMessage = validateImageFile(file);
  if (errorMessage) {
    addToast(errorMessage, 'error');
    return;
  }

  try {
    const uploadedAsset = await uploadPostMediaAsset(file);
    insertInlineImage(editor, uploadedAsset.id, file.name);
    addToast('正文图片已上传并插入', 'success');
  } catch (error) {
    addToast(getRequestErrorMessage(error, '正文图片上传失败'), 'error');
  }
}

async function handleAttachmentUpload(editor: Editor) {
  if (loadingEditingPost.value) {
    return;
  }

  const file = await pickSingleFileFromSystem(attachmentPickerAcceptValue);
  if (!file) {
    return;
  }

  const errorMessage = validateAttachmentFile(file);
  if (errorMessage) {
    addToast(errorMessage, 'error');
    return;
  }

  try {
    const uploadedAsset = await uploadPostMediaAsset(file);
    insertAttachmentLink(editor, uploadedAsset.id, file.name);
    addToast('附件已上传并插入正文', 'success');
  } catch (error) {
    addToast(getRequestErrorMessage(error, '附件上传失败'), 'error');
  }
}

function persistTagHistory() {
  if (import.meta.client) {
    localStorage.setItem(tagHistoryStorageKey, JSON.stringify(tagHistory.value));
  }
}

function rememberTag(tag: string) {
  const normalizedTag = tag.trim();
  if (!normalizedTag) return;
  tagHistory.value = [normalizedTag, ...tagHistory.value.filter((item) => item !== normalizedTag)];
  persistTagHistory();
}

function addTag() {
  if (loadingEditingPost.value) {
    return;
  }

  const tag = tagInput.value.trim();
  if (tag && !post.value.tags.includes(tag) && post.value.tags.length < 5) {
    post.value.tags.push(tag);
    rememberTag(tag);
  }
  tagInput.value = '';
}

function addHistoryTag(tag: string) {
  if (loadingEditingPost.value) {
    return;
  }

  if (post.value.tags.includes(tag) || post.value.tags.length >= 5) return;
  post.value.tags.push(tag);
  rememberTag(tag);
}

function removeTag(index: number) {
  if (loadingEditingPost.value) {
    return;
  }

  post.value.tags.splice(index, 1);
}

onMounted(() => {
  void loadPostCategories();
  void loadEditingPost();
});

onMounted(() => {
  if (!import.meta.client) return;

  const raw = localStorage.getItem(tagHistoryStorageKey);
  if (!raw) {
    persistTagHistory();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    const merged = [...parsed, ...defaultTagHistory].filter((item) => typeof item === 'string');
    tagHistory.value = Array.from(new Set(merged));
  } catch {
    tagHistory.value = [...defaultTagHistory];
  }
});

watch(editingPostId, async (nextId, previousId) => {
  if (nextId === previousId) {
    return;
  }

  if (!nextId) {
    post.value = createEmptyPostState();
    loadingEditingPost.value = false;
    return;
  }

  await loadPostCategories();
  await loadEditingPost();
});
</script>
