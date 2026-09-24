<script setup lang="ts">
import { Button, Cropper, type CropValue } from '@vitral/vue';
import { ref, useTemplateRef } from 'vue';

const src = 'https://picsum.photos/id/1027/900/1200';
const crop = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });
const cropper = useTemplateRef<InstanceType<typeof Cropper>>('cropper');

// The file, when you want the file rather than the numbers.
async function upload() {
    const blob = await cropper.value?.toBlob('image/png', { width: 256 });
    if (blob) console.log(blob);
}
</script>

<template>
    <Cropper ref="cropper" v-model="crop" :src="src" shape="circle" :preview-size="96" alt="A portrait" />
    <Button label="Get the file" size="small" @click="upload" />
</template>
