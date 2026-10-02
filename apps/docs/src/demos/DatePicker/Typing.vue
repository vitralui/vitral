<script setup lang="ts">
import { DatePicker, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const masked = ref<Date | null>(null);
const free = ref<Date | null>(null);
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-typed">In the shape of the format</Label>
            <DatePicker id="dp-typed" v-model="masked" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-free">Free, with mask off</Label>
            <DatePicker id="dp-free" v-model="free" :mask="false" placeholder="Type a date" />
        </StackPanel>
    </StackPanel>
</template>
