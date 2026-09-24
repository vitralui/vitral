<script setup lang="ts">
import { Label, Rating, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const stars = ref<number | null>(null);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label id="label-rating" size="large">How was it?</Label>
        <Rating v-model="stars" aria-labelledby="label-rating" />
    </StackPanel>
</template>
