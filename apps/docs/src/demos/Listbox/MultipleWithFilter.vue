<script setup lang="ts">
import { Label, Listbox, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const languages = [
    { name: 'Português', code: 'pt' },
    { name: 'English', code: 'en' },
    { name: 'Español', code: 'es' },
    { name: 'Français', code: 'fr' },
    { name: 'Deutsch', code: 'de' },
    { name: 'Íslenska', code: 'is' },
    { name: 'Polski', code: 'pl' },
    { name: '日本語 (Japanese)', code: 'ja' },
    { name: 'Wolof', code: 'wo' },
    { name: 'Euskara', code: 'eu' }
];
const spoken = ref<string[]>(['pt', 'en']);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label id="lb-lang-label">Languages spoken</Label>
        <Listbox v-model="spoken" :options="languages" option-label="name" option-value="code" multiple filter checkmark aria-labelledby="lb-lang-label" scroll-height="12rem" />
        <small style="color: var(--vt-text-muted-color)">Value: {{ spoken.join(', ') || 'none' }}</small>
    </StackPanel>
</template>
