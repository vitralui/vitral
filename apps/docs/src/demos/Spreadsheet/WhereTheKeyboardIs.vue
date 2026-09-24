<script setup lang="ts">
import { Spreadsheet, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const plans = ref<Record<string, string | number | boolean | null>>({
    A1: 'Plan',
    B1: 'Seats',
    C1: 'Monthly',
    A2: 'Team',
    B2: 12,
    C2: '=B2*9',
    A3: 'Business',
    B3: 40,
    C3: '=B3*7'
});

const selection = ref('A1');
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <Spreadsheet
            v-model="plans"
            :rows="8"
            :columns="4"
            aria-label="Selection example"
            style="height: 12rem; width: 100%"
            @selection-change="selection = $event.address"
        />
        <p>
            Selected: <code>{{ selection }}</code>
        </p>
    </StackPanel>
</template>
