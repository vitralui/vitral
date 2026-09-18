<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputTag',
    category: 'Form',
    description:
        'A field whose value is a list of short strings, each shown as a tag with a way out of it. Enter or a separator commits what is typed, a paste of “one, two” becomes two tags, and Backspace in an empty box takes the last one off. One tab stop: the arrow keys walk the tags, so a tag can be removed without a mouse and without a tab stop each.'
};
</script>

<script setup lang="ts">
import { InputTag, Message } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const topics = ref(['vue', 'design tokens']);
const emails = ref<string[]>([]);
const rejected = ref('');
const limited = ref(['red', 'green']);
const keywords = ref(['accessible']);

const isEmail = (tag: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(tag);

function onReject(event: { value: string; reason: string }) {
    rejected.value =
        event.reason === 'duplicate' ? `“${event.value}” is already there.` : event.reason === 'max' ? 'That is as many as it takes.' : `“${event.value}” is not an address.`;
}
</script>

<template>
    <DemoSection title="Basic" description="Type and press Enter, or type a comma. Backspace in an empty box removes the last tag.">
        <div class="demo-field">
            <label for="tag-topics">Topics</label>
            <InputTag id="tag-topics" v-model="topics" placeholder="Add a topic" fluid />
            <span class="demo-hint">{{ topics.length }} selected: {{ topics.join(' · ') || 'none' }}</span>
        </div>
    </DemoSection>

    <DemoSection
        title="Checked as they are added"
        description="`validate` refuses a tag and leaves the text in the box to be fixed; `reject` says what happened, so the field can explain itself. Several separators are allowed: this one takes a comma, a semicolon or a space."
    >
        <div class="demo-field">
            <label for="tag-emails">Invite by email</label>
            <InputTag
                id="tag-emails"
                v-model="emails"
                :separator="[',', ';', ' ']"
                :validate="isEmail"
                placeholder="name@example.com"
                :invalid="!!rejected"
                fluid
                @add="rejected = ''"
                @reject="onReject"
            />
            <Message v-if="rejected" severity="danger" size="small" variant="simple">{{ rejected }}</Message>
        </div>
    </DemoSection>

    <DemoSection title="A maximum" description="`max` stops the list where it should stop; what is refused is reported rather than dropped quietly.">
        <div class="demo-field">
            <label for="tag-max">Up to three colours</label>
            <InputTag id="tag-max" v-model="limited" :max="3" placeholder="Add a colour" fluid @reject="onReject" />
        </div>
    </DemoSection>

    <DemoSection title="Sizes and states" description="The field chrome is the shared one: the same sizes, variants, invalid and disabled states as every other input.">
        <div class="demo-stack" style="width: 100%; max-width: 30rem">
            <InputTag v-model="keywords" size="small" aria-label="Small" fluid />
            <InputTag v-model="keywords" aria-label="Default" fluid />
            <InputTag v-model="keywords" size="large" aria-label="Large" fluid />
            <InputTag v-model="keywords" variant="filled" aria-label="Filled" fluid />
            <InputTag v-model="keywords" invalid aria-label="Invalid" fluid />
            <InputTag v-model="keywords" disabled aria-label="Disabled" fluid />
            <InputTag v-model="keywords" readonly aria-label="Read-only" fluid />
        </div>
    </DemoSection>
</template>
