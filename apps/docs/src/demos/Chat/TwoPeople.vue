<script setup lang="ts">
import { Chat, type ChatMessage } from '@vitral/vue';

const chat: ChatMessage[] = [
    { id: 1, role: 'user', content: 'Are we still on for 3?', at: new Date(2026, 8, 20, 14, 2) },
    { id: 2, role: 'assistant', author: 'Priya', initials: 'PR', content: 'Yes. I pushed the deck.', at: new Date(2026, 8, 20, 14, 4) },
    { id: 3, role: 'assistant', author: 'Priya', initials: 'PR', content: 'Second slide needs your numbers.', at: new Date(2026, 8, 20, 14, 4), attachments: [{ name: 'q3-deck.pdf', size: 2_400_000, url: '#' }] },
    { id: 4, role: 'user', content: 'On it.', at: new Date(2026, 8, 20, 14, 6) }
];
</script>

<template>
    <Chat :messages="chat" variant="messenger" placeholder="Reply to Priya" aria-label="Priya" height="18rem" style="width: 100%" />
</template>
