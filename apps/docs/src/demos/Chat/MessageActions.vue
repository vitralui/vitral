<script setup lang="ts">
import { Chat, type ChatMessage } from '@vitral/vue';
import { ref } from 'vue';

const messages = ref<ChatMessage[]>([
    { id: 1, role: 'user', content: 'What changed in 0.3?' },
    { id: 2, role: 'assistant', content: 'Six new components, a guided tour as an addon of its own, trend lines on charts, and exports from the table and the schedule.' }
]);
const last = ref('');

// The chat reports the press; the rating is kept on the message, which is what shows it pressed.
function onAction({ action, message }: { action: string; message: ChatMessage }) {
    last.value = `${action} on message ${message.id}`;
    if (action !== 'like' && action !== 'dislike') return;
    messages.value = messages.value.map((m) => (m.id === message.id ? { ...m, feedback: m.feedback === action ? null : action } : m));
}
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%">
        <Chat :messages="messages" :message-actions="['copy', 'regenerate', 'like', 'dislike']" readonly aria-label="Assistant" height="14rem" style="width: 100%" @message-action="onAction" />
        <small style="color: var(--vt-text-muted-color)" aria-live="polite">{{ last && `message-action: ${last}` }}</small>
    </div>
</template>
