<script setup lang="ts">
import { Button, Tooltip as vTooltip } from '@vitral/vue';
</script>

<template>
    <Button v-tooltip.bottom="'Save the document'" icon="download" aria-label="Save" severity="secondary" />
    <Button v-tooltip="'Top is the default'" label="Top" severity="secondary" />
    <Button v-tooltip.right="'On the right'" label="Right" severity="secondary" />
    <Button v-tooltip.bottom="'Below'" label="Bottom" severity="secondary" />
    <Button v-tooltip.left="'On the left'" label="Left" severity="secondary" />
</template>
