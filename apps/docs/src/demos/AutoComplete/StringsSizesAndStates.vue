<script setup lang="ts">
import { AutoComplete } from '@vitral/vue';
import { ref } from 'vue';

const words = ref<string | null>(null);
const wordSuggestions = ref<string[]>([]);
</script>

<template>
    <AutoComplete
        v-model="words"
        :suggestions="wordSuggestions"
        aria-label="Word"
        size="small"
        @complete="wordSuggestions = ['alpha', 'beta', 'gamma', 'delta'].filter((w) => w.includes($event.query))"
    />
    <AutoComplete :suggestions="[]" aria-label="Filled" variant="filled" />
    <AutoComplete :suggestions="[]" aria-label="Loading" loading />
    <AutoComplete :suggestions="[]" aria-label="Invalid" invalid />
    <AutoComplete :suggestions="[]" aria-label="Disabled" disabled model-value="Disabled" dropdown />
</template>
