<script setup lang="ts">
import { FileUpload } from '@vitral/vue';
import { ref } from 'vue';

const status = ref('');

// There is no server behind the docs: the demo takes the file itself and pretends.
function pretend({ files }: { files: File[] }) {
    status.value = `${files.map((f) => f.name).join(', ')}: received here, and nothing left your browser.`;
}
</script>

<template>
    <FileUpload mode="basic" accept=".pdf" choose-label="Choose a PDF" custom-upload auto @uploader="pretend" />
    <small style="color: var(--vt-text-muted-color)" aria-live="polite">{{ status }}</small>
</template>
