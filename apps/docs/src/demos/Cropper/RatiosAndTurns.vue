<script setup lang="ts">
import { Cropper, type CropValue } from '@vitral/vue';
import { computed, ref } from 'vue';

const photo = 'https://picsum.photos/id/1015/1600/900';
const free = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });

const aspects = [
    { label: 'Free', value: 'free' },
    { label: '1:1', value: '1:1' },
    { label: '4:3', value: '4:3' },
    { label: '16:9', value: '16:9' }
];

const model = computed(() => {
    const { x, y, width, height, rotate } = free.value;
    return `const crop = ref<CropValue>({ x: ${Math.round(x)}, y: ${Math.round(y)}, width: ${Math.round(width)}, height: ${Math.round(height)}, rotate: ${rotate} });`;
});
</script>

<template>
    <Cropper v-model="free" :src="photo" :aspects="aspects" rotatable alt="A landscape" height="20rem" />
    <code style="font-size: 0.75rem; color: var(--vt-text-muted-color)">{{ model }}</code>
</template>
