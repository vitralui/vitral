<script setup lang="ts">
import { InputTag, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const topics = ref(['vue', 'design tokens']);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="tag-topics">Topics</Label>
        <InputTag id="tag-topics" v-model="topics" placeholder="Add a topic" fluid />
        <small style="color: var(--vt-text-muted-color)">{{ topics.length }} selected: {{ topics.join(' · ') || 'none' }}</small>
    </StackPanel>
</template>
