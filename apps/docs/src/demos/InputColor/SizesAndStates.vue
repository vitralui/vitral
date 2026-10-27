<script setup lang="ts">
import { InputColor } from '@vitral/vue';
</script>

<template>
    <div style="display: grid; gap: 0.75rem; max-width: 18rem">
        <InputColor model-value="#43a047" size="small" aria-label="Small" />
        <InputColor model-value="#43a047" aria-label="Normal" />
        <InputColor model-value="#43a047" size="large" aria-label="Large" />
        <InputColor model-value="#43a047" variant="filled" aria-label="Filled" />
        <InputColor model-value="#zzzzzz" invalid placeholder="Invalid" aria-label="Invalid" />
        <InputColor model-value="#43a047" readonly aria-label="Read only" />
        <InputColor model-value="#43a047" disabled aria-label="Disabled" />
    </div>
</template>
