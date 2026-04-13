import type { EditorToolbarItem } from '@nuxt/ui';

const inlineImageUploadItem = {
  kind: 'inlineImageUpload',
  icon: 'i-lucide-image-plus',
  tooltip: { text: '上传图片' }
} as EditorToolbarItem;

const attachmentUploadItem = {
  kind: 'attachmentUpload',
  icon: 'i-lucide-paperclip',
  tooltip: { text: '上传附件' }
} as EditorToolbarItem;

const headingItem = {
  icon: 'i-lucide-heading',
  tooltip: { text: '标题' },
  content: {
    align: 'start'
  },
  items: [
    { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: '一级标题' },
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: '二级标题' },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: '三级标题' },
    { kind: 'heading', level: 4, icon: 'i-lucide-heading-4', label: '四级标题' }
  ]
} as EditorToolbarItem;

const textAlignItem = {
  icon: 'i-lucide-align-left',
  tooltip: { text: '文本对齐' },
  content: {
    align: 'start'
  },
  items: [
    { kind: 'textAlign', align: 'left', icon: 'i-lucide-align-left', label: '左对齐' },
    { kind: 'textAlign', align: 'center', icon: 'i-lucide-align-center', label: '居中对齐' },
    { kind: 'textAlign', align: 'right', icon: 'i-lucide-align-right', label: '右对齐' },
    { kind: 'textAlign', align: 'justify', icon: 'i-lucide-align-justify', label: '两端对齐' }
  ]
} as EditorToolbarItem;

export const adminPostEditorToolbarItems: EditorToolbarItem[] = [
  headingItem,
  textAlignItem,
  { kind: 'paragraph', icon: 'i-lucide-pilcrow', tooltip: { text: '正文段落' } },
  { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: '加粗' } },
  { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: '斜体' } },
  { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: '删除线' } },
  { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: '行内代码' } },
  { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: '无序列表' } },
  { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: '有序列表' } },
  { kind: 'blockquote', icon: 'i-lucide-quote', tooltip: { text: '引用' } },
  { kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: '代码块' } },
  { kind: 'horizontalRule', icon: 'i-lucide-minus', tooltip: { text: '分隔线' } },
  { kind: 'link', icon: 'i-lucide-link', tooltip: { text: '插入链接' } },
  inlineImageUploadItem,
  attachmentUploadItem,
  { kind: 'undo', icon: 'i-lucide-undo-2', tooltip: { text: '撤销' } },
  { kind: 'redo', icon: 'i-lucide-redo-2', tooltip: { text: '重做' } },
  { kind: 'clearFormatting', icon: 'i-lucide-remove-formatting', tooltip: { text: '清除样式' } }
];
