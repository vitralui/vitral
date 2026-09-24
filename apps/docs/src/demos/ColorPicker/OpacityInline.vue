<script setup lang="ts">
import { ColorPicker } from '@vitral/vue';
import { ref } from 'vue';

const overlay = ref('3366994d');
</script>

<template>
    <ColorPicker v-model="overlay" alpha inline aria-label="Overlay colour" />
</template>
