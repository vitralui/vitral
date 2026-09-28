<script setup lang="ts">
import { Button, EmptyState } from '@vitral/vue';
</script>

<template>
    <EmptyState title="No invoices yet" description="Invoices you send appear here, with whether each was paid.">
        <template #actions>
            <Button label="New invoice" icon="plus" />
            <Button label="Import" variant="outlined" severity="secondary" />
        </template>
    </EmptyState>
</template>
