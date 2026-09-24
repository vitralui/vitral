<script setup lang="ts">
import { IconField, InputIcon, InputText, Label, StackPanel } from '@vitral/vue';
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="if-both">Username</Label>
        <IconField fluid>
            <InputIcon icon="user" />
            <InputText id="if-both" invalid />
            <InputIcon icon="warning" label="Invalid" style="color: var(--vt-danger-color)" />
        </IconField>
    </StackPanel>
</template>
