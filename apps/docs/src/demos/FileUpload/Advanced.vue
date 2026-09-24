<script setup lang="ts">
import { FileUpload } from '@vitral/vue';
import { ref } from 'vue';

const status = ref('');

// There is no server behind the docs: the demo takes the files itself and pretends.
function pretend({ files }: { files: File[] }) {
    status.value = `${files.map((f) => f.name).join(', ')}: received here, and nothing left your browser.`;
}
</script>

<template>
    <FileUpload multiple accept="image/*" :max-file-size="1000000" :file-limit="5" custom-upload @uploader="pretend">
        <template #empty>
            <span>Drag images here, up to five, 1 MB each.</span>
        </template>
    </FileUpload>
    <small style="color: var(--vt-text-muted-color)" aria-live="polite">{{ status }}</small>
</template>
