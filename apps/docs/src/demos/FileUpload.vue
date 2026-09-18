<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'FileUpload',
    category: 'Media',
    description:
        'A native file input drawn as a button, a drop zone and a queue. Files are checked for type, size and count, with refusals shown as alerts; each queued file shows its size and a remove button named after it, and a progress bar follows the upload.'
};
</script>

<script setup lang="ts">
import { FileUpload } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const status = ref('');

// There is no server behind the docs: the demo takes the files itself and pretends.
function pretend({ files }: { files: File[] }) {
    status.value = `${files.map((f) => f.name).join(', ')} — received here; nothing left your browser.`;
}
</script>

<template>
    <DemoSection title="Advanced" class="stack">
        <FileUpload multiple accept="image/*" :max-file-size="1000000" :file-limit="5" custom-upload @uploader="pretend">
            <template #empty>
                <span>Drag images here — up to five, 1 MB each.</span>
            </template>
        </FileUpload>
        <span class="demo-hint" aria-live="polite">{{ status }}</span>
    </DemoSection>
    <DemoSection title="Basic">
        <FileUpload mode="basic" accept=".pdf" choose-label="Choose a PDF" custom-upload auto @uploader="pretend" />
    </DemoSection>
</template>
