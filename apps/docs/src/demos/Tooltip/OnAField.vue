<script setup lang="ts">
import { InputText, Tooltip as vTooltip } from '@vitral/vue';
</script>

<template>
    <InputText v-tooltip.right="'Letters, digits and dashes'" aria-label="Username" placeholder="Username" />
</template>
