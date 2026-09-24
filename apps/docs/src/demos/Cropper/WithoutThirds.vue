<script setup lang="ts">
import { Cropper, type CropValue } from '@vitral/vue';
import { ref } from 'vue';

const photo = 'https://picsum.photos/id/1015/1600/900';
const plain = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });
</script>

<template>
    <Cropper v-model="plain" :src="photo" aspect="4:3" :grid="false" alt="A landscape" height="16rem" />
</template>
