<script setup lang="ts">
import { Checkbox } from '@vitral/vue';
</script>

<template>
    <Checkbox :model-value="true" size="small" label="Small" />
    <Checkbox :model-value="true" label="Normal" />
    <Checkbox :model-value="true" size="large" label="Large" />
    <Checkbox :model-value="false" invalid label="Invalid" />
    <Checkbox :model-value="false" disabled label="Disabled" />
    <Checkbox :model-value="true" disabled label="Disabled checked" />
    <Checkbox :model-value="true" readonly label="Read only" />
</template>
