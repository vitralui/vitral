<script setup lang="ts">
import { Chat, type ChatMessage } from '@vitral/vue';

// Speech as it is recognised.
const captions: ChatMessage[] = [
    { id: 1, role: 'assistant', author: 'Ana', content: 'So the second quarter came in ahead of plan.' },
    { id: 2, role: 'user', author: 'You', content: 'By how much?' },
    { id: 3, role: 'assistant', author: 'Ana', content: 'About seven per cent, mostly expansion rather than new logos', streaming: true }
];
</script>

<template>
    <Chat :messages="captions" variant="captions" readonly aria-label="Transcript" height="8rem" style="width: 100%" />
</template>
