<script setup lang="ts">
import { Chat, type ChatMessage } from '@vitral/vue';
import { ref } from 'vue';

const chat: ChatMessage[] = [
    { id: 1, role: 'user', content: 'Are we still on for 3?', at: new Date(2026, 8, 20, 14, 2) },
    { id: 2, role: 'assistant', author: 'Priya', initials: 'PR', content: 'Yes. I pushed the deck.', at: new Date(2026, 8, 20, 14, 4) },
    { id: 3, role: 'assistant', author: 'Priya', initials: 'PR', content: 'Second slide needs your numbers.', at: new Date(2026, 8, 20, 14, 4), attachments: [{ name: 'q3-deck.pdf', size: 2_400_000, url: '#' }] },
    { id: 4, role: 'user', content: 'On it.', at: new Date(2026, 8, 20, 14, 6) }
];

const widgetOpen = ref(false);
</script>

<template>
    <div style="display: flex; justify-content: flex-end; width: 100%; min-height: 4rem">
        <Chat v-model:open="widgetOpen" :messages="chat" variant="widget" aria-label="Support" height="18rem" />
    </div>
</template>
