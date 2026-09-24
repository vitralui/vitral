<script setup lang="ts">
import { Spreadsheet } from '@vitral/vue';
import { ref } from 'vue';

const scores = ref<Record<string, string | number | boolean | null>>({
    A1: 'Name',
    B1: 'Score',
    C1: 'Grade',
    A2: 'Ada',
    B2: 92,
    C2: '=IF(B2>=90,"A",IF(B2>=80,"B","C"))',
    A3: 'Alan',
    B3: 84,
    C3: '=IF(B3>=90,"A",IF(B3>=80,"B","C"))',
    A4: 'Grace',
    B4: 78,
    C4: '=IF(B4>=90,"A",IF(B4>=80,"B","C"))',
    A6: 'Average',
    B6: '=ROUND(AVERAGE(B2:B4),1)',
    A7: 'Top',
    B7: '=MAX(B2:B4)',
    A8: 'Above 80',
    B8: '=COUNTIF(B2:B4,">=80")'
});
</script>

<template>
    <Spreadsheet v-model="scores" :rows="12" :columns="4" aria-label="Scores" style="height: 16rem; width: 100%" />
</template>
