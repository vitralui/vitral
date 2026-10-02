<script setup lang="ts">
import { AutoComplete, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

interface Customer {
    name: string;
    cpf: string;
}

const customers: Customer[] = [
    { name: 'Ana Souza', cpf: '12345678901' },
    { name: 'Bruno Lima', cpf: '12398765400' },
    { name: 'Carla Dias', cpf: '98765432100' }
];

const customer = ref<Customer | string | null>(null);
const suggestions = ref<Customer[]>([]);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="ac-cpf">Customer, by CPF</Label>
        <AutoComplete
            id="ac-cpf"
            v-model="customer"
            :suggestions="suggestions"
            mask="999.999.999-99"
            unmask
            :auto-clear="false"
            option-label="name"
            @complete="suggestions = customers.filter((c) => c.cpf.startsWith($event.query))"
        >
            <template #option="{ option }">{{ (option as Customer).name }} · {{ (option as Customer).cpf }}</template>
        </AutoComplete>
        <small style="color: var(--vt-text-muted-color)">Value: {{ typeof customer === 'string' ? `"${customer}"` : (customer?.name ?? 'null') }}</small>
    </StackPanel>
</template>
