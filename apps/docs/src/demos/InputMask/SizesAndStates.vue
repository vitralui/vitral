<script setup lang="ts">
import { InputMask } from '@vitral/vue';
</script>

<template>
    <InputMask mask="999" size="small" aria-label="Small" />
    <InputMask mask="999" variant="filled" aria-label="Filled" />
    <InputMask mask="999" invalid aria-label="Invalid" />
    <InputMask mask="999" disabled model-value="123" aria-label="Disabled" />
</template>
