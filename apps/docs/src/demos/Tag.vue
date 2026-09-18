<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tag',
    category: 'Misc',
    description: 'A short label for a status or a category. `removable` adds a button named “Remove <value>”, which a press, Delete or Backspace activates.'
};
</script>

<script setup lang="ts">
import { Tag } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const severities = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'help', 'contrast'] as const;
const topics = ref(['vue', 'typescript', 'design-tokens', 'accessibility', 'layout']);
</script>

<template>
    <DemoSection title="Severities">
        <Tag v-for="s in severities" :key="s" :value="s" :severity="s" />
    </DemoSection>
    <DemoSection title="Icons and shape">
        <Tag value="New" icon="star" />
        <Tag value="Verified" icon="check" severity="success" rounded />
        <Tag value="Due today" icon="clock" severity="warn" rounded />
        <Tag value="Blocked" icon="error" severity="danger" />
    </DemoSection>
    <DemoSection title="Removable" description="Tab to a remove button and press Delete.">
        <Tag v-for="t in topics" :key="t" :value="t" severity="secondary" rounded removable @remove="topics = topics.filter((x) => x !== t)" />
        <span v-if="!topics.length" class="demo-hint">All removed.</span>
    </DemoSection>
</template>
