<script setup lang="ts">
import { InputMask, InputText, Label, StackPanel, type MaskOptions } from '@vitral/vue';
import { ref } from 'vue';

// Defined once, used by any field that takes a mask.
const employeeId: MaskOptions = { pattern: 'aa-9999', case: 'upper', unmask: true };

const inMask = ref('');
const inText = ref('');
const kept = ref('');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="mask-employee">Employee, in InputMask</Label>
            <InputMask id="mask-employee" v-model="inMask" :mask="employeeId" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ inMask || '—' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="mask-employee-text">The same mask, in InputText</Label>
            <InputText id="mask-employee-text" v-model="inText" :mask="employeeId" clearable />
            <small style="color: var(--vt-text-muted-color)">Value: {{ inText || '—' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="mask-employee-kept">The field's setting wins</Label>
            <InputMask id="mask-employee-kept" v-model="kept" :mask="employeeId" :unmask="false" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ kept || '—' }}</small>
        </StackPanel>
    </StackPanel>
</template>
