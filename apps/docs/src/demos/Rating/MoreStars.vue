<script setup lang="ts">
import { Rating } from '@vitral/vue';
import { ref } from 'vue';

const ten = ref<number | null>(7);
</script>

<template>
    <Rating v-model="ten" :stars="10" on-icon="circle" off-icon="circle" :clearable="false" aria-label="Score out of ten" />
</template>
