<script setup lang="ts">
import { InputOtp, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const code = ref('');
const status = ref('');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="otp-code">Verification code</Label>
        <InputOtp id="otp-code" v-model="code" :length="6" integer-only @complete="status = `Checking ${$event.value}…`" />
        <small style="color: var(--vt-text-muted-color)" aria-live="polite">{{ status || 'Try pasting 123456.' }}</small>
    </StackPanel>
</template>
