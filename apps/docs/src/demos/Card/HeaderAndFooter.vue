<script setup lang="ts">
import { Button, Card } from '@vitral/vue';
</script>

<template>
    <Card title="Advanced card" subtitle="With a banner and actions" style="width: 22rem">
        <template #header>
            <div style="height: 7rem; background: linear-gradient(135deg, var(--vt-primary-color), var(--vt-chart-2))" />
        </template>
        <p style="margin: 0">The header runs edge to edge and follows the card's corners. The footer lines its actions up at the bottom.</p>
        <template #footer>
            <Button label="Save" />
            <Button label="Cancel" severity="secondary" />
        </template>
    </Card>
</template>
