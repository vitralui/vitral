<script setup lang="ts">
import { Message, StackPanel } from '@vitral/vue';
</script>

<template>
    <StackPanel spacing="0.625rem" style="width: 100%">
        <Message severity="secondary" variant="outlined">Drafts are kept for 30 days.</Message>
        <Message severity="danger" variant="outlined" title="Invalid token">Sign in again to continue.</Message>
        <Message severity="danger" variant="simple">Password must have at least 8 characters.</Message>
        <Message severity="success" variant="simple" icon="check">Username is available.</Message>
    </StackPanel>
</template>
