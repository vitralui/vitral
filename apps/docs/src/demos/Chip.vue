<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Chip',
    category: 'Misc',
    description:
        'A compact token — a filter, a recipient, a tag. `removable` adds a button named “Remove <label>”, which a press, Delete or Backspace activates.'
};
</script>

<script setup lang="ts">
import { Chip } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const recipients = ref(['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton']);
</script>

<template>
    <DemoSection title="Basic">
        <Chip label="Action" />
        <Chip label="Comedy" />
        <Chip label="Mystery" />
        <Chip label="Thriller" />
    </DemoSection>
    <DemoSection title="Icon and image">
        <Chip label="Starred" icon="star" />
        <Chip label="Scheduled" icon="clock" />
        <Chip label="Ada Lovelace" image="https://i.pravatar.cc/48?img=5" />
    </DemoSection>
    <DemoSection title="Removable" description="Tab to a remove button and press Delete.">
        <Chip v-for="r in recipients" :key="r" :label="r" removable @remove="recipients = recipients.filter((x) => x !== r)" />
        <span v-if="!recipients.length" class="demo-hint">No recipients.</span>
    </DemoSection>
</template>
