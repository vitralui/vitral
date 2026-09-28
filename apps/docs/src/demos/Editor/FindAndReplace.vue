<script setup lang="ts">
import { Editor } from '@vitral/vue';
import { ref } from 'vue';

const text = ref(
    '<h3>Release notes</h3><p>The <strong>colour</strong> tokens are now grouped by colour role, and every colour a chart uses is a token of its own.</p><p>Colour contrast was checked against WCAG AA in both colour schemes.</p><pre><code>--vt-chart-1: colour-1;</code></pre>'
);
</script>

<template>
    <Editor v-model="text" :toolbar="[['bold', 'italic', 'link'], ['undo', 'redo'], ['find']]" aria-label="Release notes" style="width: 100%" />
</template>
