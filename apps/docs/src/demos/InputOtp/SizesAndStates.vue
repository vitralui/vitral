<script setup lang="ts">
import { InputOtp } from '@vitral/vue';
</script>

<template>
    <InputOtp size="small" aria-label="Small" />
    <InputOtp size="large" variant="filled" aria-label="Large, filled" />
    <InputOtp invalid aria-label="Invalid" model-value="12" />
    <InputOtp disabled aria-label="Disabled" model-value="1234" />
</template>
