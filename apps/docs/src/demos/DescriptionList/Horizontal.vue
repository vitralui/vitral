<script setup lang="ts">
import { DescriptionList } from '@vitral/vue';

const items = [
    { label: 'Plan', value: 'Team, billed yearly' },
    { label: 'Seats', value: '12 of 15 used' },
    { label: 'Renews', value: '1 March 2027' },
    { label: 'Payment', value: 'Visa ending 4242' }
];
</script>

<template>
    <DescriptionList :items="items" layout="horizontal" label-width="7rem" striped style="width: min(100%, 32rem)" />
</template>
