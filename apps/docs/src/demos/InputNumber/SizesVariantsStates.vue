<script setup lang="ts">
import { InputNumber } from '@vitral/vue';
</script>

<template>
    <InputNumber :model-value="1" show-buttons size="small" aria-label="Small" />
    <InputNumber :model-value="2" show-buttons aria-label="Normal" />
    <InputNumber :model-value="3" show-buttons size="large" aria-label="Large" />
    <InputNumber :model-value="4" variant="filled" aria-label="Filled" />
    <InputNumber :model-value="5" invalid aria-label="Invalid" />
    <InputNumber :model-value="6" show-buttons disabled aria-label="Disabled" />
    <InputNumber :model-value="7" show-buttons readonly aria-label="Read only" />
</template>
