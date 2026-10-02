<script setup lang="ts">
import { InputMask, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const taxId = ref('');
const phone = ref('');
// Landlines have eight digits after the area code, mobiles nine.
const phoneMask = (raw: string) => (raw.length > 10 ? '(99) 99999-9999' : '(99) 9999-9999?9');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="1.5rem" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="mask-taxid">CPF or CNPJ</Label>
            <InputMask id="mask-taxid" v-model="taxId" :mask="['999.999.999-99', '99.999.999/9999-99']" unmask />
            <small style="color: var(--vt-text-muted-color)">Value: {{ taxId || '—' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="mask-br-phone">Phone</Label>
            <InputMask id="mask-br-phone" v-model="phone" :mask="phoneMask" autocomplete="tel-national" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ phone || '—' }}</small>
        </StackPanel>
    </StackPanel>
</template>
