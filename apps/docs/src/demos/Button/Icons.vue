<script setup lang="ts">
import { Button } from '@vitral/vue';
</script>

<template>
    <Button label="New" icon="plus" />
    <Button label="Next" icon="arrowRight" icon-pos="right" severity="secondary" />
    <Button label="Upload" icon="upload" icon-pos="top" severity="secondary" variant="outlined" />
    <Button icon="search" aria-label="Search" />
    <Button icon="trash" severity="danger" variant="text" aria-label="Delete" />
    <Button icon="star" rounded severity="warn" aria-label="Favourite" />
</template>
