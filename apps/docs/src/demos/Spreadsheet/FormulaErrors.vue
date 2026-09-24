<script setup lang="ts">
import { Spreadsheet } from '@vitral/vue';
import { ref } from 'vue';

const errors = ref<Record<string, string | number | boolean | null>>({
    A1: '=1/0',
    A2: '=NOPE(1)',
    A3: '=A3+1',
    A4: '=VLOOKUP("nothing",B1:C2,2)',
    A5: '=IFERROR(1/0,"caught")',
    B1: 'divided by nothing',
    B2: 'no such function',
    B3: 'reads itself',
    B4: 'not in the list',
    B5: 'caught instead'
});
</script>

<template>
    <Spreadsheet v-model="errors" :rows="8" :columns="3" :column-widths="{ B: 180 }" aria-label="Errors" style="height: 12rem; width: 100%" />
</template>
