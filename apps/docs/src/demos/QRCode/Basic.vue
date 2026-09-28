<script setup lang="ts">
import { InputText, QRCode } from '@vitral/vue';
import { ref } from 'vue';

const text = ref('https://vitral.dev');
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center">
        <QRCode :value="text" />
        <InputText v-model="text" aria-label="Text to encode" style="flex: 1 1 16rem" />
    </div>
</template>
