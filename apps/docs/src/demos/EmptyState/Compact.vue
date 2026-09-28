<script setup lang="ts">
import { Button, EmptyState } from '@vitral/vue';
</script>

<template>
    <EmptyState size="small" align="start" icon="search" title="No results for “invoces”" description="Check the spelling, or search every folder.">
        <template #actions><Button label="Search everywhere" size="small" variant="text" /></template>
    </EmptyState>
</template>
