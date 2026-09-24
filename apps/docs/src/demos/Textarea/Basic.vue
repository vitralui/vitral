<script setup lang="ts">
import { Label, StackPanel, Textarea } from '@vitral/vue';
import { ref } from 'vue';

const notes = ref('');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="ta-notes">Notes</Label>
        <Textarea id="ta-notes" v-model="notes" placeholder="Write something…" aria-describedby="ta-notes-hint" maxlength="280" />
        <small id="ta-notes-hint" style="color: var(--vt-text-muted-color)">{{ notes.length }} / 280</small>
    </StackPanel>
</template>
