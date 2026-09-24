<script setup lang="ts">
import { Message, StackPanel } from '@vitral/vue';
</script>

<template>
    <StackPanel spacing="0.625rem" style="width: 100%">
        <Message severity="info" title="Update available">Restart the app to install version 2.4.</Message>
        <Message severity="success" title="Backup complete">1,204 files were copied to the cloud.</Message>
        <Message severity="warn" title="Storage almost full">You have used 92% of your 15 GB.</Message>
        <Message severity="danger" title="Sync failed">The server could not be reached. Check your connection and try again.</Message>
    </StackPanel>
</template>
