<script setup lang="ts">
import { InputPassword, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const password = ref('');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="pw-basic">Password</Label>
        <InputPassword id="pw-basic" v-model="password" autocomplete="new-password" />
    </StackPanel>
</template>
