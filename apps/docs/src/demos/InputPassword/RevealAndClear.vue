<script setup lang="ts">
import { InputPassword, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const password = ref('');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="pw-reveal">Password</Label>
        <InputPassword id="pw-reveal" v-model="password" toggle-mask clearable :feedback="false" autocomplete="current-password" />
    </StackPanel>
</template>
