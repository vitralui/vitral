<script setup lang="ts">
import { Chat, type ChatMessage } from '@vitral/vue';

const copilot: ChatMessage[] = [
    { id: 1, role: 'user', content: 'Explain this function.' },
    { id: 2, role: 'assistant', content: 'It groups consecutive messages from one speaker so the avatar is drawn once a run rather than once a message.' },
    { id: 3, role: 'user', content: 'What if two people share a role?' },
    { id: 4, role: 'assistant', content: 'Then the author breaks the run: the names differ, so the messages do not join.' }
];
</script>

<template>
    <div style="max-width: 22rem; width: 100%">
        <Chat :messages="copilot" variant="copilot" placeholder="Ask about this file" aria-label="Copilot" height="16rem" />
    </div>
</template>
