<script setup lang="ts">
import { InputOtp, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const pin = ref('');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="otp-pin">PIN</Label>
        <InputOtp id="otp-pin" v-model="pin" mask integer-only />
    </StackPanel>
</template>
