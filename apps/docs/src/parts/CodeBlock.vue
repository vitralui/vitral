<script setup lang="ts">
import { computed, ref } from 'vue';
import { highlight, langOf } from '../lib/highlight';

const props = defineProps<{ code: string; label?: string; lang?: 'vue' | 'ts' | 'bash' | 'css'; bare?: boolean }>();

const html = computed(() => highlight(props.code.trim(), props.lang ?? langOf(props.label ?? '')));
const copied = ref(false);

async function copy() {
    try {
        await navigator.clipboard.writeText(props.code.trim());
        copied.value = true;
        setTimeout(() => (copied.value = false), 1600);
    } catch {
        // A clipboard the browser refuses is not worth an error dialog; the
        // code is on screen and selectable either way.
    }
}
</script>

<template>
    <div class="code">
        <div v-if="!bare" class="code-head">
            <span>{{ label ?? 'Example' }}</span>
            <button class="copy-btn copy" type="button" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</button>
        </div>
        <pre><code v-html="html" /></pre>
    </div>
</template>
