<script setup lang="ts">
import { Label, StackPanel, Textarea } from '@vitral/vue';
import { ref } from 'vue';

const letter = ref('Dear reader,\n\nThis box grows as you type, and shrinks again when you delete.');
</script>

<template>
    <StackPanel spacing="0.375rem" style="width: 24rem">
        <Label for="ta-letter">Letter</Label>
        <Textarea id="ta-letter" v-model="letter" auto-resize :rows="2" fluid />
    </StackPanel>
</template>
