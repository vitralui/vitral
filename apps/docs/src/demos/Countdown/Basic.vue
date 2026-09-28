<script setup lang="ts">
import { Countdown } from '@vitral/vue';

const launch = new Date(Date.now() + ((3 * 24 + 5) * 60 + 42) * 60 * 1000);
</script>

<template>
    <Countdown :to="launch" />
</template>
