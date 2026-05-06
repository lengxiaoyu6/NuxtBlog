<template>
  <div class="space-y-8 pb-20">
    <section class="admin-theme-card rounded-[2.25rem] p-5 sm:p-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex items-start gap-4">
          <UButton
            to="/admin/posts"
            color="neutral"
            variant="soft"
            square
            class="mt-1 h-11 w-11 rounded-2xl"
            aria-label="返回文章列表"
          >
            <UIcon name="i-lucide-arrow-left" class="size-5" />
          </UButton>

          <div class="space-y-3">
            <div class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-200">
              <UIcon :name="isEditMode ? 'i-lucide-pencil-line' : 'i-lucide-notebook-pen'" class="size-4" />
              {{ isEditMode ? '编辑文章' : '撰写文章' }}
            </div>

            <div class="space-y-2">
              <h1 class="font-serif text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {{ isEditMode ? '编辑文章' : '新建文章' }}
              </h1>
              <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">
                {{ loadingEditingPost ? '正在加载文章详情，请稍候。' : '标题、正文、封面、标签与发布设置统一集中在同一页维护。' }}
              </p>
            </div>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:w-auto">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-save"
            class="justify-center"
            :loading="submitting"
            :disabled="submitting || loadingEditingPost || !canSubmitPost"
            @click="submitPost('draft')"
          >
            {{ isEditMode ? '保存草稿' : '创建草稿' }}
          </UButton>
          <UButton
            icon="i-lucide-send"
            class="justify-center"
            :loading="submitting"
            :disabled="submitting || loadingEditingPost || !canSubmitPost"
            @click="submitPost('published')"
          >
            {{ isEditMode ? '更新并发布' : '发布文章' }}
          </UButton>
        </div>
      </div>
    </section>

    <div
      :inert="loadingEditingPost"
      :aria-busy="loadingEditingPost"
      :class="loadingEditingPost ? 'pointer-events-none opacity-70' : ''"
      class="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]"
    >
      <div class="order-2 space-y-6 xl:order-1">
        <UCard
          :ui="{
            root: 'admin-theme-card rounded-[2rem] shadow-none ring-0',
            header: 'p-5 sm:p-6',
            body: 'px-5 pb-5 sm:px-6 sm:pb-6'
          }"
        >
          <template #header>
            <div class="flex items-start gap-3">
              <div class="grid size-10 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                <UIcon name="i-lucide-settings-2" class="size-5" />
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-950 dark:text-white">发布设置</h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">管理分类、链接别名与置顶状态。</p>
              </div>
            </div>
          </template>

          <div class="space-y-5">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-900 dark:text-white">URL 别名</label>
              <UInput
                v-model="post.slug"
                :disabled="loadingEditingPost"
                icon="i-lucide-link-2"
                size="lg"
                placeholder="custom-url-slug"
              />
              <p class="text-xs text-slate-400">留空时由系统按标题生成。</p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-900 dark:text-white">分类目录</label>
              <USelectMenu
                v-model="post.category"
                :disabled="loadingEditingPost"
                :items="categories"
                size="lg"
                placeholder="选择文章分类"
                icon="i-lucide-layers-3"
                trailing-icon="i-lucide-chevron-down"
                class="w-full"
              >
                <template #item="{ item }">
                  <div class="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5">
                    <span
                      class="truncate font-medium"
                      :class="item === post.category ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'"
                    >
                      {{ item }}
                    </span>
                    <UIcon
                      v-if="item === post.category"
                      name="i-lucide-check"
                      class="size-4 shrink-0 text-brand-600 dark:text-brand-300"
                    />
                  </div>
                </template>
              </USelectMenu>
            </div>

            <div class="rounded-[1.5rem] border border-white/70 bg-white/60 p-4 dark:border-slate-800/70 dark:bg-slate-950/40">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-sm font-bold text-slate-900 dark:text-white">文章置顶</p>
                  <p class="text-xs leading-5 text-slate-500 dark:text-slate-400">置顶文章会在列表页与部分推荐位优先显示。</p>
                </div>
                <USwitch v-model="post.isPinned" :disabled="loadingEditingPost" />
              </div>
            </div>
          </div>
        </UCard>

        <UCard
          :ui="{
            root: 'admin-theme-card rounded-[2rem] shadow-none ring-0',
            header: 'p-5 sm:p-6',
            body: 'px-5 pb-5 sm:px-6 sm:pb-6'
          }"
        >
          <template #header>
            <div class="flex items-start gap-3">
              <div class="grid size-10 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                <UIcon name="i-lucide-tags" class="size-5" />
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-950 dark:text-white">标签与推荐</h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">当前最多支持 5 个标签，并保留最近使用记录。</p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div
              class="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-3 transition-all focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-950/40"
              @click="tagInputRef?.focus()"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-for="(tag, index) in post.tags"
                  :key="tag"
                  class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200"
                >
                  <span class="text-brand-500">#</span>
                  {{ tag }}
                  <button
                    type="button"
                    class="inline-flex rounded-full p-0.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                    :disabled="loadingEditingPost"
                    @click.stop="removeTag(index)"
                  >
                    <UIcon name="i-lucide-x" class="size-3" />
                  </button>
                </span>

                <input
                  ref="tagInputRef"
                  v-model="tagInput"
                  :disabled="loadingEditingPost"
                  type="text"
                  placeholder="输入标签后回车"
                  class="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                  @keydown.enter.prevent="addTag"
                >
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">历史标签</p>
                <span class="text-xs text-slate-400 dark:text-slate-500">{{ displayedTagHistory.length }} 个</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="historyTag in displayedTagHistory"
                  :key="historyTag"
                  type="button"
                  class="inline-flex rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
                  :class="post.tags.includes(historyTag)
                    ? 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800/70 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-brand-200 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:border-brand-800/70 dark:hover:text-brand-300'"
                  :disabled="loadingEditingPost || (post.tags.length >= 5 && !post.tags.includes(historyTag))"
                  @click="addHistoryTag(historyTag)"
                >
                  #{{ historyTag }}
                </button>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <div class="order-1 min-w-0 space-y-6 xl:order-2">
        <UCard
          :ui="{
            root: 'admin-theme-card rounded-[2rem] shadow-none ring-0',
            body: 'p-5 sm:p-6'
          }"
        >
          <div class="space-y-3">
            <label class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">文章标题</label>
            <input
              v-model="post.title"
              :disabled="loadingEditingPost"
              type="text"
              placeholder="输入文章标题"
              class="w-full bg-transparent text-3xl font-black tracking-tight text-slate-950 outline-none placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-600 sm:text-4xl"
            >
          </div>
        </UCard>

        <UCard
          :ui="{
            root: 'admin-theme-card rounded-[2rem] shadow-none ring-0 overflow-hidden',
            header: 'p-5 sm:p-6',
            body: 'px-5 pb-5 sm:px-6 sm:pb-6'
          }"
        >
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-start gap-3">
                <div class="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <UIcon name="i-lucide-file-text" class="size-5" />
                </div>
                <div>
                  <h2 class="text-lg font-black text-slate-950 dark:text-white">文章正文</h2>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">保留现有 Markdown 编辑器、图片上传、附件插入与尺寸调整能力。</p>
                </div>
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <UIcon name="i-lucide-image-up" class="size-4" />
                {{ pendingMediaUploadCount > 0 ? `正在上传 ${pendingMediaUploadCount} 项资源` : '编辑器工具栏已启用上传能力' }}
              </div>
            </div>
          </template>

          <UEditor
            ref="editorRef"
            v-slot="{ editor }"
            v-model="post.contentMarkdown"
            content-type="markdown"
            placeholder="在此输入正文内容，支持 Markdown 与可视化排版..."
            class="editor-content w-full rounded-[1.5rem] border border-slate-200 dark:border-slate-800"
            :ui="editorUi"
            :extensions="editorExtensions"
            :handlers="editorCustomHandlers"
            :image="false"
          >
            <UEditorToolbar
              :editor="editor"
              :items="editorToolbarItems"
              class="sticky top-0 z-10 rounded-t-[1.5rem] border-b border-slate-200 bg-white/90 p-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
            />
            <UEditorToolbar
              :editor="editor"
              :items="imageResizeToolbarItems"
              layout="bubble"
              :should-show="shouldShowImageResizeToolbar"
              class="rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900/95"
            />
          </UEditor>
        </UCard>
      </div>

      <div class="order-3 space-y-6 xl:order-3">
        <UCard
          :ui="{
            root: 'admin-theme-card rounded-[2rem] shadow-none ring-0 overflow-hidden',
            header: 'p-5 sm:p-6',
            body: 'px-5 pb-5 sm:px-6 sm:pb-6'
          }"
        >
          <template #header>
            <div class="flex items-start gap-3">
              <div class="grid size-10 place-items-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
                <UIcon name="i-lucide-image" class="size-5" />
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-950 dark:text-white">封面图片</h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">建议尺寸 1200 × 630，支持常见图片格式。</p>
              </div>
            </div>
          </template>

          <button
            type="button"
            class="group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center transition-all hover:border-brand-300 hover:bg-brand-50/70 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-brand-800/70 dark:hover:bg-brand-950/20"
            @click="openCoverImagePicker"
          >
            <img
              v-if="post.cover"
              :src="post.cover"
              alt="文章封面"
              class="h-56 w-full rounded-[1.25rem] object-cover shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
            >
            <template v-else>
              <div class="grid size-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-300">
                <UIcon name="i-lucide-upload-cloud" class="size-7" />
              </div>
              <p class="mt-4 text-sm font-bold text-slate-900 dark:text-white">点击上传封面图片</p>
              <p class="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                仅接受 JPG、PNG、WEBP、GIF、BMP、AVIF，文件大小上限 10 MB。
              </p>
            </template>

            <div
              v-if="post.cover"
              class="absolute inset-x-4 bottom-4 rounded-2xl bg-slate-950/65 px-4 py-3 text-left text-white backdrop-blur"
            >
              <p class="text-sm font-bold">当前已设置封面</p>
              <p class="mt-1 text-xs text-white/75">再次点击可重新选择文件。</p>
            </div>
          </button>
        </UCard>

        <UCard
          :ui="{
            root: 'admin-theme-card rounded-[2rem] shadow-none ring-0',
            header: 'p-5 sm:p-6',
            body: 'px-5 pb-5 sm:px-6 sm:pb-6'
          }"
        >
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="grid size-10 place-items-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
                  <UIcon name="i-lucide-file-text" class="size-5" />
                </div>
                <div>
                  <h2 class="text-lg font-black text-slate-950 dark:text-white">文章摘要</h2>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">摘要会展示在文章列表页与搜索结果描述中。</p>
                </div>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                {{ post.excerpt.length }}/150
              </span>
            </div>
          </template>

          <textarea
            v-model="post.excerpt"
            :disabled="loadingEditingPost"
            rows="8"
            maxlength="150"
            placeholder="简要描述文章核心内容，便于列表页与搜索结果展示。"
            class="min-h-44 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
          />
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminPostDetail } from '~/types/post';
import type { AdminPostUpsertInput, BlogPostStatus } from '~~/shared/types/post';
import { type Editor, isNodeSelection } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import type { EditorCustomHandlers } from '@nuxt/ui';
import type { EditorToolbarItem } from '@nuxt/ui';
import { uploadAssets } from '~/services/admin-media';
import { listPostCategories } from '~/services/admin-post-category';
import { adminPostEditorToolbarItems } from '~/constants/admin-post-editor-toolbar';
import type { AdminPostCategoryItem } from '~/types/admin-post-category';
import { resolveRequestErrorMessage } from '~/utils/request-error';

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

function readSelectedImageNode(selection: unknown) {
  if (!isNodeSelection(selection) || selection.node.type.name !== 'image') {
    return null;
  }

  return selection;
}

const shouldShowImageResizeToolbar = ({ view, state }: { view: { hasFocus: () => boolean }; state: { selection: unknown } }) => {
  return view.hasFocus() && Boolean(readSelectedImageNode(state.selection));
};


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
    addToast(resolveRequestErrorMessage(error, '文章加载失败'), 'error');
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
    addToast(resolveRequestErrorMessage(error, '分类列表加载失败'), 'error');
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
    addToast(resolveRequestErrorMessage(error, '文章保存失败'), 'error');
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
  const selection = readSelectedImageNode(editor.state.selection);
  if (!selection) {
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
    addToast(resolveRequestErrorMessage(error, '封面图片上传失败'), 'error');
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
    addToast(resolveRequestErrorMessage(error, '正文图片上传失败'), 'error');
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
    addToast(resolveRequestErrorMessage(error, '附件上传失败'), 'error');
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
