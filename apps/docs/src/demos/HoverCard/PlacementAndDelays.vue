<script setup lang="ts">
import { HoverCard } from '@vitral/vue';
</script>

<template>
    <HoverCard placement="right" :open-delay="200" :close-delay="100">
        <template #trigger><a href="#">Faster, to the right</a></template>
        <img src="https://picsum.photos/id/1025/320/180" alt="A pug wrapped in a blanket" style="display: block; width: 100%; border-radius: 6px" />
    </HoverCard>
</template>
