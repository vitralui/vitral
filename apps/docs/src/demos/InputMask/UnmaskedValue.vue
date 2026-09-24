<script setup lang="ts">
import { InputMask, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const cpf = ref('');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="mask-cpf">CPF</Label>
        <InputMask id="mask-cpf" v-model="cpf" mask="999.999.999-99" unmask />
        <small style="color: var(--vt-text-muted-color)">v-model: {{ cpf || '—' }}</small>
    </StackPanel>
</template>
