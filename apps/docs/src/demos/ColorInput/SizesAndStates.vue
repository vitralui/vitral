<script setup lang="ts">
import { ColorInput } from '@vitral/vue';
</script>

<template>
    <div style="display: grid; gap: 0.75rem; max-width: 18rem">
        <ColorInput model-value="#43a047" size="small" aria-label="Small" />
        <ColorInput model-value="#43a047" aria-label="Normal" />
        <ColorInput model-value="#43a047" size="large" aria-label="Large" />
        <ColorInput model-value="#43a047" variant="filled" aria-label="Filled" />
        <ColorInput model-value="#zzzzzz" invalid placeholder="Invalid" aria-label="Invalid" />
        <ColorInput model-value="#43a047" readonly aria-label="Read only" />
        <ColorInput model-value="#43a047" disabled aria-label="Disabled" />
    </div>
</template>
