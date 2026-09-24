<script setup lang="ts">
import { Button, Cropper, type CropValue, StackPanel } from '@vitral/vue';
import { ref, useTemplateRef } from 'vue';

const portrait = 'https://picsum.photos/id/1027/900/1200';
const avatar = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });

// The file, when the file is what you want: a canvas, then a Blob to upload.
const cropper = useTemplateRef<InstanceType<typeof Cropper>>('avatarCropper');
const saved = ref<string | null>(null);
const savedSize = ref(0);

async function save() {
    const blob = await cropper.value?.toBlob('image/png', { width: 256 });
    if (!blob) return;
    if (saved.value) URL.revokeObjectURL(saved.value);
    saved.value = URL.createObjectURL(blob);
    savedSize.value = blob.size;
}
</script>

<template>
    <StackPanel spacing="1rem" style="flex: 1 1 100%; min-width: 0">
        <Cropper ref="avatarCropper" v-model="avatar" :src="portrait" shape="circle" alt="A portrait" height="18rem" :preview-size="96" />
        <StackPanel orientation="horizontal" spacing="0.625rem" align="center" wrap>
            <Button label="Crop to a 256px PNG" size="small" @click="save" />
            <small v-if="saved" style="color: var(--vt-text-muted-color)">{{ Math.round(savedSize / 1024) }} kB</small>
            <img v-if="saved" :src="saved" alt="The cropped avatar" width="48" height="48" style="border-radius: 50%" />
        </StackPanel>
    </StackPanel>
</template>
