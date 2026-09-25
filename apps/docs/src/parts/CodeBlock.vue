<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { track } from '../lib/analytics';
import { t } from '../lib/i18n';
import { computed, ref } from 'vue';
import { highlight, highlightLines, langOf } from '../lib/highlight';

const props = defineProps<{ code: string; label?: string; lang?: 'vue' | 'ts' | 'bash' | 'css' | 'md' | 'text'; bare?: boolean; numbered?: boolean }>();

const html = computed(() => highlight(props.code.trim(), props.lang ?? langOf(props.label ?? '')));
/**
 * Numbered, every line is a row of its own — its number, then its code — so a
 * long line wraps under itself instead of sending the block sideways.
 */
const lines = computed(() => (props.numbered ? highlightLines(props.code.trim(), props.lang ?? langOf(props.label ?? '')) : []));
const copied = ref(false);

async function copy() {
    try {
        await navigator.clipboard.writeText(props.code.trim());
        copied.value = true;
        track('copy_code', { label: props.label ?? 'example' });
        setTimeout(() => (copied.value = false), 1600);
    } catch {
        // A clipboard the browser refuses is not worth an error dialog; the
        // code is on screen and selectable either way.
    }
}
</script>

<template>
    <div class="code" :class="{ 'code-bare': bare }">
        <div v-if="!bare" class="code-head">
            <span>{{ label ?? t('Example') }}</span>
            <button class="code-copy" type="button" :aria-label="copied ? t('Copied') : t('Copy the code')" :title="copied ? t('Copied') : t('Copy the code')" @click="copy">
                <Icon :icon="copied ? 'check' : 'copy'" />
            </button>
        </div>
        <!-- Without a head, the button floats in the corner of the code itself. -->
        <button v-else class="code-copy code-copy-float" type="button" :aria-label="copied ? t('Copied') : t('Copy the code')" :title="copied ? t('Copied') : t('Copy the code')" @click="copy">
            <Icon :icon="copied ? 'check' : 'copy'" />
        </button>
        <div v-if="numbered" class="code-scroll">
            <pre class="code-lines" :style="{ '--code-digits': String(lines.length).length }"><code><span v-for="(line, index) in lines" :key="index" class="code-line"><span class="code-ln" aria-hidden="true">{{ index + 1 }}</span><span class="code-text" v-html="line || ' '" /></span></code></pre>
        </div>
        <pre v-else><code v-html="html" /></pre>
    </div>
</template>
