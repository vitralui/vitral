<script setup lang="ts">
import { DatePicker, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();
const footer = ref<Date | null>(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="dp-footer">Due</Label>
        <DatePicker id="dp-footer" v-model="footer" show-today-button show-clear-button />
    </StackPanel>
</template>
