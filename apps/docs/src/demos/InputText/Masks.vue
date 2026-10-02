<script setup lang="ts">
import { Icon, InputText, Label, StackPanel, type MaskOptions } from '@vitral/vue';
import { ref } from 'vue';

// The old plate until a letter comes fifth, then the Mercosul one, in capitals.
const plateMask: MaskOptions = { pattern: (raw) => (/^[A-Za-z]{3}[0-9][A-Za-z]/.test(raw) ? 'aaa9a99' : 'aaa-9*99'), case: 'upper' };

const taxId = ref('');
const phone = ref('');
const plate = ref('');
const zip = ref('');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="it-zip">Postal code, a pattern</Label>
            <InputText id="it-zip" v-model="zip" mask="99999-999" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ zip || '—' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="it-phone">Phone, a list</Label>
            <InputText id="it-phone" v-model="phone" :mask="['(99) 9999-9999', '(99) 99999-9999']" autocomplete="tel-national" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ phone || '—' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="it-taxid">CPF or CNPJ, with the clear button</Label>
            <InputText id="it-taxid" v-model="taxId" :mask="['999.999.999-99', '99.999.999/9999-99']" unmask clearable>
                <template #prefix><Icon icon="user" /></template>
            </InputText>
            <small style="color: var(--vt-text-muted-color)">Value: {{ taxId || '—' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="it-plate">Vehicle plate, an object</Label>
            <InputText id="it-plate" v-model="plate" :mask="plateMask" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ plate || '—' }}</small>
        </StackPanel>
    </StackPanel>
</template>
