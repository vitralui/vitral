<script setup lang="ts">
import { Panel } from '@vitral/vue';
import { ref } from 'vue';

const collapsed = ref(false);
</script>

<template>
    <Panel v-model:collapsed="collapsed" header="Advanced settings" toggleable style="width: 100%">
        <p style="margin: 0">Press the header, or Tab to it and press Enter or Space, to collapse this content.</p>
    </Panel>
    <small style="color: var(--vt-text-muted-color)">collapsed: {{ collapsed }}</small>
</template>
