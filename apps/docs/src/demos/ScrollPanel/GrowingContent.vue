<script setup lang="ts">
import { Button, ScrollPanel } from '@vitral/vue';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start">
        <Button :label="open ? 'Close the section' : 'Open the section'" severity="secondary" @click="open = !open" />
        <ScrollPanel scrollbar="always" aria-label="Report" style="width: 100%; max-width: 28rem; height: 12rem; border: 1px solid var(--vt-content-border-color); border-radius: 8px">
            <div style="padding: 1rem">
                <p style="margin: 0 0 0.75rem">The bar is measured again when what is inside grows, not only when the panel does: open the section and its thumb shrinks while the section is still opening.</p>
                <div :style="{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 400ms ease' }">
                    <div style="overflow: hidden">
                        <p v-for="n in 6" :key="n" style="margin: 0 0 0.75rem">Section line {{ n }}. An image that finishes loading, or text that arrives, is followed in the same way.</p>
                    </div>
                </div>
            </div>
        </ScrollPanel>
    </div>
</template>
