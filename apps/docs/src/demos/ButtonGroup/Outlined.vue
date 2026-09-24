<script setup lang="ts">
import { Button, ButtonGroup } from '@vitral/vue';
</script>

<template>
    <ButtonGroup aria-label="Pages">
        <Button icon="chevronLeft" aria-label="Previous" variant="outlined" severity="secondary" />
        <Button label="1" variant="outlined" severity="secondary" />
        <Button label="2" variant="outlined" severity="secondary" />
        <Button icon="chevronRight" aria-label="Next" variant="outlined" severity="secondary" />
    </ButtonGroup>
</template>
