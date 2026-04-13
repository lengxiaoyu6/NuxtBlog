<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden mx-auto">
        <div class="p-8">
          <div :class="[
            type === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600',
            'w-14 h-14 rounded-2xl flex items-center justify-center mb-6'
          ]">
            <component :is="iconComponent" :size="28" />
          </div>
          
          <h3 class="text-xl font-black text-slate-900 dark:text-white font-serif">{{ title }}</h3>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">{{ message }}</p>
          
          <div class="flex items-center gap-3 mt-8">
            <button 
              @click="handleCancel"
              class="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              {{ cancelText }}
            </button>
            <button 
              @click="handleConfirm"
              :class="[
                type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20',
                'flex-1 px-6 py-3 text-white text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95'
              ]"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { AlertCircle, HelpCircle, Trash2, CheckCircle } from 'lucide-vue-next';

interface Props {
  modelValue: boolean;
  title: string;
  message: string;
  type?: 'primary' | 'danger' | 'warning' | 'success';
  confirmText?: string;
  cancelText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  confirmText: '确定',
  cancelText: '取消'
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const iconComponent = computed(() => {
  switch (props.type) {
    case 'danger': return Trash2;
    case 'success': return CheckCircle;
    case 'warning': return AlertCircle;
    default: return HelpCircle;
  }
});

const handleCancel = () => {
  isOpen.value = false;
  emit('cancel');
};

const handleConfirm = () => {
  emit('confirm');
  isOpen.value = false;
};
</script>
