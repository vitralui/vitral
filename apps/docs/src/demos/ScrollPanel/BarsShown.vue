<script setup lang="ts">
import { ScrollPanel, SelectButton } from '@vitral/vue';
import { ref } from 'vue';

const mode = ref<'hover' | 'always' | 'native'>('always');
const modes = ['hover', 'always', 'native'];
const items = Array.from({ length: 24 }, (_, i) => `Item ${i + 1}`);
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start">
        <SelectButton v-model="mode" :options="modes" :allow-empty="false" aria-label="Scrollbar" />
        <ScrollPanel :scrollbar="mode" aria-label="Items" style="width: 16rem; max-height: 12rem; border: 1px solid var(--vt-content-border-color); border-radius: 8px">
            <ul style="margin: 0; padding: 0.5rem 1rem; list-style: none">
                <li v-for="item in items" :key="item" style="padding: 0.25rem 0">{{ item }}</li>
            </ul>
        </ScrollPanel>
    </div>
</template>
