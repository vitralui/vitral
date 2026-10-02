<script setup lang="ts">
import { DateRange, Label, StackPanel, type DateRangeValue } from '@vitral/vue';
import { ref } from 'vue';

const typed = ref<DateRangeValue>({ start: null, end: null });
const shown = ref<DateRangeValue>({ start: null, end: null });
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 18rem">
            <Label for="dr-typed">Typed into its shape</Label>
            <DateRange id="dr-typed" v-model="typed" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 18rem">
            <Label for="dr-shown">Shown only, opens on a press</Label>
            <DateRange id="dr-shown" v-model="shown" :manual-input="false" placeholder="Pick a range" />
        </StackPanel>
    </StackPanel>
</template>
