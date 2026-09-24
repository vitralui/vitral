<script setup lang="ts">
import { Button, Toolbar } from '@vitral/vue';
</script>

<template>
    <Toolbar aria-label="Text formatting" roving>
        <template #start>
            <Button icon="copy" severity="secondary" variant="text" aria-label="Copy" />
            <Button icon="pencil" severity="secondary" variant="text" aria-label="Edit" />
            <Button icon="star" severity="secondary" variant="text" aria-label="Favourite" disabled />
            <Button icon="externalLink" severity="secondary" variant="text" aria-label="Open" />
        </template>
        <template #end>
            <Button label="Share" icon="user" severity="secondary" />
        </template>
    </Toolbar>
</template>
