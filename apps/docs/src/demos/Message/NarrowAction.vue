<script setup lang="ts">
import { Button, Message, StackPanel } from '@vitral/vue';
</script>

<template>
    <StackPanel spacing="0.625rem" style="width: 100%; max-width: 24rem">
        <Message severity="warn" title="Payment overdue" closable>
            The invoice for September is five days late.
            <template #action>
                <Button label="Pay now" size="small" severity="secondary" />
            </template>
        </Message>
        <Message severity="warn" title="Payment overdue" closable :stack-action="false">
            The invoice for September is five days late.
            <template #action>
                <Button label="Pay now" size="small" severity="secondary" />
            </template>
        </Message>
    </StackPanel>
</template>
