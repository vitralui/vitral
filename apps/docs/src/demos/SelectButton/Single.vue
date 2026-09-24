<script setup lang="ts">
import { SelectButton } from '@vitral/vue';
import { ref } from 'vue';

const view = ref('Week');
</script>

<template>
    <div style="display: grid; gap: 0.5rem; justify-items: start">
        <SelectButton v-model="view" :options="['Day', 'Week', 'Month']" label="Calendar view" :allow-empty="false" />
        <small style="color: var(--vt-text-muted-color)">value: {{ view }}</small>
    </div>
</template>
