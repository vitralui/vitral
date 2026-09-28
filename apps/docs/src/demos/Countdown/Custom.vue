<script setup lang="ts">
import { Countdown } from '@vitral/vue';

const sale = new Date(Date.now() + (5 * 60 + 12) * 60 * 1000);
const pad = (n: number) => String(n).padStart(2, '0');
</script>

<template>
    <Countdown :to="sale">
        <template #default="{ hours, minutes, seconds, done }">
            <span v-if="done">The sale is over.</span>
            <span v-else style="font: 600 1.5rem/1 ui-monospace, monospace; padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: #111827; color: #fbbf24">
                {{ pad(hours) }}:{{ pad(minutes) }}:{{ pad(seconds) }}
            </span>
        </template>
    </Countdown>
</template>
