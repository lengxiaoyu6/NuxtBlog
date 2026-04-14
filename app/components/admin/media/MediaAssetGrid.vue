<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    <MediaAssetCard
      v-for="asset in assets"
      :key="asset.id"
      :asset="asset"
      :selected="selectedAssetIds.includes(asset.id)"
      @select-asset="$emit('select-asset', $event)"
      @toggle-selection="$emit('toggle-selection', $event)"
      @open-preview="$emit('open-preview', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import MediaAssetCard from '~/components/admin/media/MediaAssetCard.vue';
import type { MediaAsset } from '~/types/admin-media';

defineProps<{
  assets: MediaAsset[];
  selectedAssetIds: string[];
}>();

defineEmits<{
  (event: 'select-asset', assetId: string): void;
  (event: 'toggle-selection', assetId: string): void;
  (event: 'open-preview', assetId: string): void;
}>();
</script>
