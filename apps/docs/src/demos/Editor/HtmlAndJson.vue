<script setup lang="ts">
import { Editor, type EditorJSON } from '@vitral/vue';
import { ref } from 'vue';

const output = ref('<p>Type here and watch <strong>both</strong> formats change.</p>');
const outputJson = ref<EditorJSON | null>(null);
</script>

<template>
    <Editor v-model="output" v-model:json="outputJson" aria-label="Output example" :toolbar="[['blockType'], ['bold', 'italic', 'color', 'highlight'], ['bulletList', 'link']]" style="width: 100%" />
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; width: 100%">
        <pre class="demo-output" aria-label="HTML" tabindex="0" style="margin: 0; max-height: 16rem; overflow: auto; white-space: pre-wrap; font-size: 0.75rem">{{ output }}</pre>
        <pre class="demo-output" aria-label="JSON" tabindex="0" style="margin: 0; max-height: 16rem; overflow: auto; font-size: 0.75rem">{{ JSON.stringify(outputJson, null, 2) }}</pre>
    </div>
</template>
