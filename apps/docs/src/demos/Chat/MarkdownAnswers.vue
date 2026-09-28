<script setup lang="ts">
import { Chat, type ChatMessage, type ChatSendPayload } from '@vitral/vue';
import { ref } from 'vue';

const answer = `Two steps:

1. Install the package with \`pnpm add @vitral/vue\`.
2. Register it once, in **main.ts**:

\`\`\`ts
app.use(Vitral, { theme: 'aura' });
\`\`\`

> Every colour is a token, so a theme is a *set of values*, not a stylesheet.

More in the [theming guide](https://vitral.dev/guides/theming).`;

const messages = ref<ChatMessage[]>([
    { id: 1, role: 'user', content: 'How do I set up **Vitral**?' },
    { id: 2, role: 'assistant', content: answer }
]);
let next = 3;

// The same answer again, a few characters at a time, to show it stays legible while it arrives.
function send({ text }: ChatSendPayload) {
    messages.value = [...messages.value, { id: next++, role: 'user', content: text }];
    const id = next++;
    messages.value = [...messages.value, { id, role: 'assistant', content: '', streaming: true }];
    let shown = 0;
    const timer = setInterval(() => {
        shown = Math.min(answer.length, shown + 6);
        messages.value = messages.value.map((m) => (m.id === id ? { ...m, content: answer.slice(0, shown), streaming: shown < answer.length } : m));
        if (shown >= answer.length) clearInterval(timer);
    }, 40);
}
</script>

<template>
    <Chat :messages="messages" markdown placeholder="Ask again" aria-label="Setup help" height="26rem" style="width: 100%" @send="send" />
</template>
