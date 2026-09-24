<script setup lang="ts">
import { Button, Tooltip as vTooltip } from '@vitral/vue';
import { ref } from 'vue';

const enabled = ref(true);
</script>

<template>
    <Button v-tooltip="{ value: 'Shown after half a second', showDelay: 500 }" label="Show delay" severity="secondary" />
    <Button v-tooltip="{ value: 'Lingers for a second after you leave', hideDelay: 1000 }" label="Hide delay" severity="secondary" />
    <Button
        v-tooltip="{ value: 'Tooltips wrap at twenty rem so a long explanation stays readable instead of running across the whole window.', placement: 'bottom' }"
        label="Long text"
        severity="secondary"
    />
    <Button v-tooltip="{ value: 'Now you see me', disabled: !enabled }" :label="enabled ? 'Enabled' : 'Disabled'" severity="secondary" @click="enabled = !enabled" />
</template>
