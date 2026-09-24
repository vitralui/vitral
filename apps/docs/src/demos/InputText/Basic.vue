<script setup lang="ts">
import { InputText, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const name = ref('');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="it-name">Name</Label>
        <InputText id="it-name" v-model="name" placeholder="Your name" aria-describedby="it-name-hint" />
        <small id="it-name-hint" style="color: var(--vt-text-muted-color)">Typed: {{ name || '—' }}</small>
    </StackPanel>
</template>
