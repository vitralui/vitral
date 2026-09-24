<script setup lang="ts">
import { Chat, type ChatAttachment, type ChatMessage, type ChatSendPayload } from '@vitral/vue';
import { onBeforeUnmount, ref } from 'vue';

let nextId = 100;
const answers = [
    'Every colour a component draws comes from a token, so a preset changes all of them at once. `dt` overrides them for one instance.',
    'The addon has no framework in it: `createChat(element, config)` draws into any element and returns a handle. The Vue component is a wrapper around that.',
    'The log is one tab stop. The arrows move a message, Home and End jump, and the composer is always one Tab away.'
];
let answer = 0;

const messages = ref<ChatMessage[]>([
    { id: 1, role: 'system', content: 'Today' },
    { id: 2, role: 'user', content: 'Can I theme this?', at: new Date(2026, 8, 20, 9, 12) },
    {
        id: 3,
        role: 'assistant',
        author: 'Vitral',
        content: 'Yes — every colour is a token. Ask me anything else.',
        at: new Date(2026, 8, 20, 9, 12),
        citations: [{ title: 'Theming', url: '#' }]
    }
]);
const draft = ref('');
const typing = ref(false);
const staged = ref<ChatAttachment[]>([]);
let timer = 0;

function reply() {
    const text = answers[answer % answers.length]!;
    answer++;
    const id = nextId++;
    typing.value = false;
    messages.value = [...messages.value, { id, role: 'assistant', author: 'Vitral', content: '', streaming: true, at: new Date() }];
    // A token at a time, which is what makes the caret worth drawing.
    const words = text.split(' ');
    let at = 0;
    timer = window.setInterval(() => {
        at++;
        const done = at >= words.length;
        messages.value = messages.value.map((m) => (m.id === id ? { ...m, content: words.slice(0, at).join(' '), streaming: !done } : m));
        if (done) window.clearInterval(timer);
    }, 55);
}

function send({ text, attachments }: ChatSendPayload) {
    messages.value = [...messages.value, { id: nextId++, role: 'user', content: text, at: new Date(), attachments: attachments.length ? attachments : undefined }];
    draft.value = '';
    staged.value = [];
    typing.value = true;
    window.clearInterval(timer);
    timer = window.setTimeout(reply, 600);
}

const attach = (files: File[]) => (staged.value = [...staged.value, ...files.map((f) => ({ name: f.name, size: f.size, type: f.type }))]);
onBeforeUnmount(() => window.clearInterval(timer));
</script>

<template>
    <Chat
        v-model:draft="draft"
        v-model:attachments="staged"
        :messages="messages"
        :typing="typing"
        :suggestions="['Can I theme this?', 'Does it need a framework?', 'How does the keyboard work?']"
        allow-attachments
        aria-label="Vitral assistant"
        height="22rem"
        style="width: 100%"
        @send="send"
        @attach="attach"
    />
</template>
