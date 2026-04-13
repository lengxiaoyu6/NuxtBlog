import { computed, ref, watch } from 'vue';
import type { AdminSettingsSaveState } from '~/types/admin-settings';

type EditorFeedbackTone = 'success' | 'error';

export function useAdminPageEditor<T>(initialValue: T, cloneValue: (value: T) => T) {
  const form = ref<T>(cloneValue(initialValue));
  const savedSnapshot = ref<T>(cloneValue(initialValue));
  const saveState = ref<AdminSettingsSaveState>('saved');
  const feedbackMessage = ref('设置已保存');
  const feedbackTone = ref<EditorFeedbackTone>('success');

  const hasUnsavedChanges = computed(() => JSON.stringify(form.value) !== JSON.stringify(savedSnapshot.value));

  const isActionDisabled = computed(() => saveState.value === 'saving' || !hasUnsavedChanges.value);

  const bottomStatusText = computed(() => {
    if (saveState.value === 'saving') {
      return '页面正在写入当前修改，请稍候。';
    }

    if (saveState.value === 'dirty') {
      return '存在尚未保存的修改，保存后会同步当前页面展示内容。';
    }

    if (saveState.value === 'error') {
      return '表单中仍有需要修正的内容。';
    }

    return '当前页面内容与最近一次保存结果一致。';
  });

  watch(
    form,
    () => {
      if (saveState.value === 'saving') {
        return;
      }

      feedbackMessage.value = '';
      feedbackTone.value = 'success';
      saveState.value = hasUnsavedChanges.value ? 'dirty' : 'saved';
    },
    { deep: true }
  );

  function resetForm() {
    form.value = cloneValue(savedSnapshot.value);
    feedbackMessage.value = '';
    feedbackTone.value = 'success';
    saveState.value = 'saved';
  }

  function beginSaving() {
    feedbackMessage.value = '';
    saveState.value = 'saving';
  }

  function markError(message: string) {
    feedbackMessage.value = message;
    feedbackTone.value = 'error';
    saveState.value = 'error';
  }

  function markSaved(nextValue: T, message = '设置已保存') {
    savedSnapshot.value = cloneValue(nextValue);
    form.value = cloneValue(nextValue);
    feedbackMessage.value = message;
    feedbackTone.value = 'success';
    saveState.value = 'saved';
  }

  return {
    form,
    savedSnapshot,
    saveState,
    feedbackMessage,
    feedbackTone,
    hasUnsavedChanges,
    isActionDisabled,
    bottomStatusText,
    resetForm,
    beginSaving,
    markError,
    markSaved,
  };
}
