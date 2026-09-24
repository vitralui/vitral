<script setup lang="ts">
import { Cropper, type CropValue } from '@vitral/vue';
import { ref } from 'vue';

const photo = 'https://picsum.photos/id/1015/1600/900';
const banner = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });

const rounded = (value: CropValue) => `{ x: ${Math.round(value.x)}, y: ${Math.round(value.y)}, width: ${Math.round(value.width)}, height: ${Math.round(value.height)}, rotate: ${value.rotate} }`;
</script>

<template>
    <Cropper v-model="banner" :src="photo" aspect="16:9" alt="A landscape" height="18rem" />
    <small style="color: var(--vt-text-muted-color)">{{ rounded(banner) }}</small>
</template>
