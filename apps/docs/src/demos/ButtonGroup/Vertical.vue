<script setup lang="ts">
import { Button, ButtonGroup } from '@vitral/vue';
</script>

<template>
    <ButtonGroup orientation="vertical" aria-label="Zoom">
        <Button icon="plus" aria-label="Zoom in" severity="secondary" />
        <Button icon="minus" aria-label="Zoom out" severity="secondary" />
    </ButtonGroup>
</template>
