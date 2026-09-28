<script setup lang="ts">
import { Stat } from '@vitral/vue';
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 2.5rem">
        <Stat label="Median load time" :value="1.18" suffix="s" :delta="-0.21" invert caption="after the image change" />
        <Stat label="Cloud costs" :value="3120" prefix="$" :delta="0.08" invert caption="this week" />
    </div>
</template>
