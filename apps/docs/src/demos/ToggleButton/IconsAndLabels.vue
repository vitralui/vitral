<script setup lang="ts">
import { ToggleButton } from '@vitral/vue';
import { ref } from 'vue';

const starred = ref(true);
const locked = ref(false);
</script>

<template>
    <ToggleButton v-model="starred" on-label="Starred" off-label="Star" on-icon="star" off-icon="star" aria-label="Star" />
    <ToggleButton v-model="locked" on-label="On" off-label="Off" on-icon="check" off-icon="close" aria-label="Lock editing" />
</template>
