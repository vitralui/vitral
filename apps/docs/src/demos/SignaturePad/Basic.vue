<script setup lang="ts">
import { SignaturePad } from '@vitral/vue';
import { ref } from 'vue';

const signature = ref<string | null>(null);
</script>

<template>
    <div style="display: grid; gap: 1rem; max-width: 32rem">
        <SignaturePad v-model="signature" aria-label="Signature" />
        <div v-if="signature" style="display: flex; gap: 1rem; align-items: center">
            <span>Stored as:</span>
            <img :src="signature" alt="The signature, as stored" style="height: 3rem; border: 1px dashed currentColor; border-radius: 0.375rem; opacity: 0.8" />
        </div>
    </div>
</template>
