<script setup lang="ts">
import { Editor } from '@vitral/vue';
import { ref } from 'vue';

const terms = ref(
    '<h3>Terms</h3><p>Read-only text can still be <mark data-color="yellow">selected and copied</mark>, and <a href="https://example.com" target="_blank">links</a> open.</p><ol><li><p>First</p></li><li><p>Second</p></li></ol>'
);
</script>

<template>
    <Editor v-model="terms" readonly :toolbar="false" aria-label="Terms" style="width: 100%" />
</template>
