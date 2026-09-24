<script setup lang="ts">
import { Chat, type ChatMessage } from '@vitral/vue';
import { ref } from 'vue';

const failed: ChatMessage[] = [
    { id: 1, role: 'user', content: 'Summarise the thread.' },
    { id: 2, role: 'assistant', error: 'The model did not answer in time.', retryable: true }
];

const retried = ref(0);
</script>

<template>
    <Chat :messages="failed" readonly aria-label="Failed answer" height="10rem" style="width: 100%" @retry="retried++" />
    <template v-if="retried"><small style="color: var(--vt-text-muted-color)">Asked again {{ retried }} times</small></template>
</template>
