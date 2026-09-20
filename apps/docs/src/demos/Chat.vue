<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Chat',
    category: 'Data',
    description:
        'A conversation with no dependency: `<Chat :messages v-model:draft>`. Runs of messages from one speaker are grouped so a thread reads as speech; an answer that is still arriving grows in place with a caret after it; tools an agent reached for are shown as the steps they were. Five shapes from one component — a plain thread, a messenger, a copilot column, an agent with its tool calls, and a launcher with a panel — plus captions for speech as it is recognised. The log is one tab stop with the arrows moving inside it, so a thread of two hundred messages does not bury the composer, and a message is announced only once it settles, because a live region that changes on every token says nothing a screen reader can follow.'
};
</script>

<script setup lang="ts">
import { Chat, type ChatAttachment, type ChatMessage, type ChatSendPayload } from '@vitral/vue';
import { onBeforeUnmount, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

// ---- a thread that answers, a token at a time

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

// ---- two people
const chat: ChatMessage[] = [
    { id: 1, role: 'user', content: 'Are we still on for 3?', at: new Date(2026, 8, 20, 14, 2) },
    { id: 2, role: 'assistant', author: 'Priya', initials: 'PR', content: 'Yes. I pushed the deck.', at: new Date(2026, 8, 20, 14, 4) },
    { id: 3, role: 'assistant', author: 'Priya', initials: 'PR', content: 'Second slide needs your numbers.', at: new Date(2026, 8, 20, 14, 4), attachments: [{ name: 'q3-deck.pdf', size: 2_400_000, url: '#' }] },
    { id: 4, role: 'user', content: 'On it.', at: new Date(2026, 8, 20, 14, 6) }
];

// ---- an agent that used its tools
const agent: ChatMessage[] = [
    { id: 1, role: 'user', content: 'How many customers churned last month?' },
    {
        id: 2,
        role: 'assistant',
        author: 'Analyst',
        content: 'Fourteen, down from twenty-two in July. The fall is almost all in the Starter plan.',
        toolCalls: [
            { name: 'run_query', input: 'SELECT count(*) FROM churn WHERE month = 8', output: '14', status: 'done' },
            { name: 'compare_period', input: 'month = 7', output: '22', status: 'done' }
        ],
        citations: [{ title: 'churn.sql', url: '#' }]
    },
    { id: 3, role: 'assistant', author: 'Analyst', content: '', toolCalls: [{ name: 'draw_chart', input: 'churn by plan', status: 'running' }] }
];

// ---- a copilot beside the work
const copilot: ChatMessage[] = [
    { id: 1, role: 'user', content: 'Explain this function.' },
    { id: 2, role: 'assistant', content: 'It groups consecutive messages from one speaker so the avatar is drawn once a run rather than once a message.' },
    { id: 3, role: 'user', content: 'What if two people share a role?' },
    { id: 4, role: 'assistant', content: 'Then the author breaks the run: the names differ, so the messages do not join.' }
];

// ---- speech as it is recognised
const captions: ChatMessage[] = [
    { id: 1, role: 'assistant', author: 'Ana', content: 'So the second quarter came in ahead of plan.' },
    { id: 2, role: 'user', author: 'You', content: 'By how much?' },
    { id: 3, role: 'assistant', author: 'Ana', content: 'About seven per cent, mostly expansion rather than new logos', streaming: true }
];

// ---- one that failed
const failed: ChatMessage[] = [
    { id: 1, role: 'user', content: 'Summarise the thread.' },
    { id: 2, role: 'assistant', error: 'The model did not answer in time.', retryable: true }
];

const widgetOpen = ref(false);
const retried = ref(0);
</script>

<template>
    <DemoSection
        title="Default"
        description="Ask it something. The answer arrives a token at a time, with a caret after the last character, and is announced once it settles. Attach a file with the paperclip; Enter sends and Shift+Enter breaks the line."
    >
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
    </DemoSection>

    <DemoSection title="Two people" description="`variant=&quot;messenger&quot;`: both sides get a bubble and an avatar, and a run of messages from one person is grouped under one name.">
        <Chat :messages="chat" variant="messenger" placeholder="Reply to Priya" aria-label="Priya" height="18rem" style="width: 100%" />
    </DemoSection>

    <DemoSection
        title="An agent and its tools"
        description="`variant=&quot;agent&quot;`: each tool the assistant reached for is a step that can be opened — what it was asked and what it answered — and one still running says so. That is the whole reason to show the steps at all."
    >
        <Chat :messages="agent" variant="agent" readonly aria-label="Analyst" height="20rem" style="width: 100%" />
    </DemoSection>

    <DemoSection title="A copilot beside the work" description="`variant=&quot;copilot&quot;`: a narrow column, no bubbles and no avatars, for a panel that sits next to what is being written.">
        <div style="max-width: 22rem; width: 100%">
            <Chat :messages="copilot" variant="copilot" placeholder="Ask about this file" aria-label="Copilot" height="16rem" />
        </div>
    </DemoSection>

    <DemoSection title="Captions" description="`variant=&quot;captions&quot;`: a running transcript rather than a conversation — no bubbles, no sides, the speaker's name in front, and the line still being recognised carrying the caret.">
        <Chat :messages="captions" variant="captions" readonly aria-label="Transcript" height="8rem" style="width: 100%" />
    </DemoSection>

    <DemoSection title="A widget" description="`variant=&quot;widget&quot;`: a launcher, and the thread in a panel that opens over the page. The launcher says whether the panel is open, and names itself either way.">
        <div style="display: flex; justify-content: flex-end; width: 100%; min-height: 4rem">
            <Chat v-model:open="widgetOpen" :messages="chat" variant="widget" aria-label="Support" height="18rem" />
        </div>
    </DemoSection>

    <DemoSection title="When an answer fails" description="A message with an `error` takes its place in the thread, and `retryable` puts the ask-again button under it.">
        <Chat :messages="failed" readonly aria-label="Failed answer" height="10rem" style="width: 100%" @retry="retried++" />
        <template v-if="retried"><span class="demo-hint">Asked again {{ retried }} times</span></template>
    </DemoSection>
</template>
